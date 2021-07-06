/**
 * WEBSWITCH (c)
 * websocket clients connect to a common server,
 * which broadcasts any messages it receives.
 */
"use strict";

import http from "http";
import websocket from "websocket";
import dns from "dns/promises";

const FQDN = process.env.WEBSWITCH_HOST || "webswitch.aegis.dev";
const PORT = 8060;
const PATH = "/api/publish";

async function getHostName() {
  try {
    return (await dns.lookup(FQDN)) ? FQDN : "localhost";
  } catch (error) {
    console.warn("dns lookup", error);
  }
  return "localhost";
}

async function httpClient({
  hostname,
  port,
  path,
  method = "GET",
  payload = "",
}) {
  return new Promise(function (resolve, reject) {
    const contentLength = ["POST", "PATCH"].includes(method)
      ? Buffer.byteLength(payload)
      : 0;
    const contentHeaders = { "Content-Type": "application/json" };
    const headers =
      contentLength > 0
        ? { ...contentHeaders, "Content-Length": contentLength }
        : contentHeaders;

    const options = {
      hostname,
      port,
      path,
      method,
      headers,
    };

    const req = http.request(options, res => {
      res.setEncoding("utf8");
      res.on("data", chunk => {
        console.log(chunk);
      });
      res.on("end", () => {});
    });

    req.on("error", e => {
      reject(e);
    });

    req.on("finish", resolve);

    // Write data to request body
    if (contentLength > 0) req.write(payload);
  });
}

/**
 * Connect to Webswitch server.
 * @returns {Promise<websocket.connection>}
 */
async function webswitchConnect(client, url, observer) {
  return new Promise(function (resolve, reject) {
    console.debug("connecting to...", url);

    client.on("connect", function (connection) {
      console.debug("...connected to", url, connection.remoteAddress);

      connection.on("message", function (message) {
        console.debug("received message from", url);

        if (message.type === "utf8") {
          const event = JSON.parse(message);

          observer.notify(event.eventName, {
            message,
            address: connection.remoteAddress,
          });
        }
      });

      resolve(connection);
    });

    client.on("connectFailed", function (error) {
      reject(error);
    });

    client.connect(url);
  });
}

export async function publishEvent(event, observer, useWebswitch = true) {
  if (!event) return;

  const hostname = await getHostName();
  const serializedEvent = JSON.stringify(event);
  let webswitchConnection;

  if (useWebswitch) {
    if (!(webswitchConnection && webswitchConnection.connected)) {
      // login
      await httpClient({
        hostname,
        port: PORT,
        path: "/login",
        method: "POST",
      });

      webswitchConnection = await webswitchConnect(
        new websocket.client(),
        `ws://${hostname}:${PORT}${PATH}`,
        observer
      );
    }
    webswitchConnection.sendUTF(serializedEvent);
  } else {
    httpClient({
      hostname,
      port,
      path,
      method: "POST",
      payload: serialziedEvent,
    });
  }
}
