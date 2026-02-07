/**
 * Printful API Service Module
 * Handles product synchronization, order creation, and order status tracking
 * Uses OAuth 2.0 Bearer Token Authentication
 *
 * Environment: PRINTFUL_API_TOKEN required in .env
 */

const API_BASE_URL = 'https://api.printful.com';
const API_TOKEN = process.env.PRINTFUL_API_TOKEN;

/**
 * Helper function to build fetch headers with Bearer token
 * @returns {Object} Headers object with Authorization and Content-Type
 */
function getHeaders() {
  if (!API_TOKEN) {
    throw new Error('PRINTFUL_API_TOKEN is not defined in environment variables');
  }

  return {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Helper function to handle API responses and errors
 * @param {Response} response - Fetch response object
 * @param {string} endpoint - API endpoint for logging
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If response is not ok
 */
async function handleResponse(response, endpoint) {
  const data = await response.json();

  if (!response.ok) {
    console.error(`[Printful API Error] ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      error: data.error || data.message || 'Unknown error',
    });

    throw new Error(`Printful API Error: ${data.error || data.message || response.statusText}`);
  }

  console.log(`[Printful API Success] ${endpoint}:`, {
    status: response.status,
    dataReceived: !!data,
  });

  return data;
}

/**
 * Sync products to Printful store
 * POST /store/products
 *
 * @param {Object} productData - Product sync data
 * @param {Object} productData.sync_product - Main product object
 * @param {string} productData.sync_product.name - Product name
 * @param {Array} productData.sync_variants - Array of product variants
 * @returns {Promise<Object>} Response with created product/variants
 */
export async function syncProducts(productData) {
  const endpoint = 'POST /store/products';

  console.log(`[Printful API Call] ${endpoint}:`, {
    productName: productData?.sync_product?.name,
    variantCount: productData?.sync_variants?.length || 0,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/store/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });

    return await handleResponse(response, endpoint);
  } catch (error) {
    console.error(`[Printful API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Create a new order in Printful
 * POST /orders
 *
 * @param {Object} orderData - Order data
 * @param {Object} orderData.recipient - Customer shipping address
 * @param {string} orderData.recipient.name - Customer name
 * @param {string} orderData.recipient.address1 - Street address
 * @param {string} orderData.recipient.city - City
 * @param {string} orderData.recipient.state_code - State/Province code
 * @param {string} orderData.recipient.zip - Postal code
 * @param {string} orderData.recipient.country_code - Country code (ISO)
 * @param {Array} orderData.items - Array of items to order
 * @param {number} orderData.items[].variant_id - Printful variant ID
 * @param {number} orderData.items[].quantity - Quantity
 * @returns {Promise<Object>} Response with created order details
 */
export async function createOrder(orderData) {
  const endpoint = 'POST /orders';

  console.log(`[Printful API Call] ${endpoint}:`, {
    recipientName: orderData?.recipient?.name,
    itemCount: orderData?.items?.length || 0,
    totalQuantity: orderData?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });

    return await handleResponse(response, endpoint);
  } catch (error) {
    console.error(`[Printful API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Get the status of a specific order
 * GET /orders/{orderId}
 *
 * @param {number|string} orderId - Printful order ID
 * @returns {Promise<Object>} Response with order details and current status
 */
export async function getOrderStatus(orderId) {
  const endpoint = `GET /orders/${orderId}`;

  console.log(`[Printful API Call] ${endpoint}`);

  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response, endpoint);
  } catch (error) {
    console.error(`[Printful API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * List all orders from the Printful store
 * GET /orders
 *
 * @param {Object} [options] - Optional query parameters
 * @param {string} [options.status] - Filter by status (pending, in_fulfillment, fulfilled, shipped, etc.)
 * @param {number} [options.limit] - Limit number of results (default 50)
 * @param {number} [options.offset] - Pagination offset
 * @returns {Promise<Object>} Response with array of orders
 */
export async function listOrders(options = {}) {
  const endpoint = 'GET /orders';

  // Build query string
  const queryParams = new URLSearchParams();
  if (options.status) queryParams.append('status', options.status);
  if (options.limit) queryParams.append('limit', options.limit);
  if (options.offset) queryParams.append('offset', options.offset);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  console.log(`[Printful API Call] ${endpoint}${queryString}`, {
    filters: options,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/orders${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response, endpoint);
  } catch (error) {
    console.error(`[Printful API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Get shipping rates for a potential order
 * POST /shipping/rates
 *
 * @param {Object} recipient - Customer shipping address
 * @param {string} recipient.name - Customer name
 * @param {string} recipient.address1 - Street address
 * @param {string} recipient.city - City
 * @param {string} recipient.state_code - State/Province code
 * @param {string} recipient.zip - Postal code
 * @param {string} recipient.country_code - Country code (ISO)
 * @param {Array} items - Array of items for rate calculation
 * @param {number} items[].variant_id - Printful variant ID
 * @param {number} items[].quantity - Quantity
 * @returns {Promise<Object>} Response with available shipping rates
 */
export async function getShippingRates(recipient, items) {
  const endpoint = 'POST /shipping/rates';

  const payload = {
    recipient,
    items,
  };

  console.log(`[Printful API Call] ${endpoint}:`, {
    recipientCountry: recipient?.country_code,
    itemCount: items?.length || 0,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/shipping/rates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return await handleResponse(response, endpoint);
  } catch (error) {
    console.error(`[Printful API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Export all service functions
 * This allows the module to be imported as: import * as printful from './printful.js'
 */
export default {
  syncProducts,
  createOrder,
  getOrderStatus,
  listOrders,
  getShippingRates,
};
