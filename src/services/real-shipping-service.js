'use strict'

export const Shipping = {

  async shipOrder(order) {
    console.log('REAL shipping order %s', { ...order });
  },

  async trackShipment(orderNo) {
    console.log('REAL track shipment %s', orderNo);
  },

  async verifyDelivery(orderNo) {
    console.log('REAL verify delivery order %s', orderNo);
  }

}