// services/mpesaService.js
const axios = require('axios');

class MpesaService {
  constructor(config) {
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.businessShortCode = config.businessShortCode;
    this.passkey = config.passkey;
    this.callbackUrl = config.callbackUrl;
  }

  async authenticate() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('MPesa authentication error:', error);
      throw error;
    }
  }

  async getTransactionStatus(transactionId) {
    try {
      const token = await this.authenticate();
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query',
        {
          Initiator: this.businessShortCode,
          SecurityCredential: this.generateSecurityCredential(),
          CommandID: 'TransactionStatusQuery',
          TransactionID: transactionId,
          PartyA: this.businessShortCode,
          IdentifierType: '4',
          ResultURL: this.callbackUrl,
          QueueTimeOutURL: this.callbackUrl,
          Remarks: 'Transaction status query',
          Occasion: 'Reconciliation'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('MPesa transaction status error:', error);
      throw error;
    }
  }

  async getAccountBalance() {
    try {
      const token = await this.authenticate();
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query',
        {
          Initiator: this.businessShortCode,
          SecurityCredential: this.generateSecurityCredential(),
          CommandID: 'AccountBalance',
          PartyA: this.businessShortCode,
          IdentifierType: '4',
          ResultURL: this.callbackUrl,
          QueueTimeOutURL: this.callbackUrl,
          Remarks: 'Balance query'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('MPesa balance query error:', error);
      throw error;
    }
  }

  generateSecurityCredential() {
    // Implement security credential generation
    // This is a simplified version
    return Buffer.from(`${this.businessShortCode}${this.passkey}${new Date().toISOString().split('T')[0]}`).toString('base64');
  }

  // Simulate fetching recent transactions (for development)
  async getRecentTransactions(days = 7) {
    // In production, this would call the actual M-Pesa API
    // For development, return mock data
    return [
      {
        reference: `MPESA${Date.now()}1`,
        amount: 15000,
        sender_name: 'JOHN DOE',
        sender_account: '254712345678',
        transaction_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        reference: `MPESA${Date.now()}2`,
        amount: 5000,
        sender_name: 'MARY JAOKO',
        sender_account: '254798765432',
        transaction_date: new Date(Date.now() - 12 * 60 * 60 * 1000),
        status: 'completed'
      }
    ];
  }
}

module.exports = MpesaService;