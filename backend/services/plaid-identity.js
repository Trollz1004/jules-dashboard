/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PLAID IDENTITY VERIFICATION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Human verification using Plaid Identity Verification
 * For dating platform compliance (MCC 7273)
 *
 * Created: January 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: process.env.PLAID_ENV === 'production' 
    ? PlaidEnvironments.production 
    : process.env.PLAID_ENV === 'development'
    ? PlaidEnvironments.development
    : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

/**
 * Create Plaid Link token for identity verification
 * @param {string} userId - Unique user identifier
 * @returns {Promise<Object>} Link token and expiration
 */
export async function createIdentityLinkToken(userId) {
  try {
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'YouAndINotAI',
      products: [Products.Identity],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    
    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  } catch (error) {
    console.error('Plaid link token creation error:', error.response?.data || error.message);
    throw new Error(`Failed to create link token: ${error.message}`);
  }
}

/**
 * Exchange public token for access token
 * @param {string} publicToken - Public token from Plaid Link
 * @returns {Promise<Object>} Access token and item ID
 */
export async function exchangePublicToken(publicToken) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error) {
    console.error('Plaid token exchange error:', error.response?.data || error.message);
    throw new Error(`Failed to exchange token: ${error.message}`);
  }
}

/**
 * Get identity data from Plaid
 * @param {string} accessToken - Plaid access token
 * @returns {Promise<Object>} Identity data and verification status
 */
export async function getIdentity(accessToken) {
  try {
    const response = await plaidClient.identityGet({
      access_token: accessToken,
    });

    const identity = response.data.accounts.map(account => ({
      accountId: account.account_id,
      owners: account.owners.map(owner => ({
        names: owner.names,
        emails: owner.emails,
        phoneNumbers: owner.phone_numbers,
        addresses: owner.addresses,
      })),
    }));

    return {
      identity,
      verified: identity.length > 0,
    };
  } catch (error) {
    console.error('Plaid identity retrieval error:', error.response?.data || error.message);
    throw new Error(`Failed to retrieve identity: ${error.message}`);
  }
}

/**
 * Test Plaid API connection
 * @returns {Promise<Object>} Connection test result
 */
export async function testConnection() {
  try {
    // Test with a simple API call
    const response = await plaidClient.identityGet({
      access_token: 'test',
    });
    
    return {
      success: false,
      message: 'Unexpected success with test token',
    };
  } catch (error) {
    // Expected to fail with test token - this confirms API is reachable
    if (error.response?.status === 400 || error.response?.status === 401) {
      return {
        success: true,
        message: 'Plaid API is reachable and responding',
        environment: process.env.PLAID_ENV || 'sandbox',
      };
    }
    
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
    };
  }
}

export default {
  createIdentityLinkToken,
  exchangePublicToken,
  getIdentity,
  testConnection,
};
