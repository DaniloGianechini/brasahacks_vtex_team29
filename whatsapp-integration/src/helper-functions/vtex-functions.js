const fetch = require("node-fetch");

const doVtexRequest = async (url) => {
  const appKey = process.env.APP_KEY;
  const appToken = process.env.APP_TOKEN;

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json; charset=utf-8",
      "X-VTEX-API-AppKey": appKey,
      "X-VTEX-API-AppToken": appToken,
    },
  };

  const response = await fetch(url, options);
  const results = await response.json();

  return results;
};

const getProductsBySearchTerm = async (searchTerm) => {
  const url = `https://cosmetics2.vtexcommercestable.com.br/api/catalog_system/pub/products/search/${searchTerm}`;

  const results = await doVtexRequest(url);

  // results is an array of objects folowing this structure: https://developers.vtex.com/vtex-rest-api/reference/search-3#productsearch

  return results;
};

const getPriceBySKU = async (SKUId) => {
  const url = `https://api.vtex.com/apiexamples/pricing/prices/${SKUId}`;

  const results = await doVtexRequest(url);

  // results is an array of objects folowing this structure: https://developers.vtex.com/vtex-rest-api/reference/prices-and-fixed-prices#getprice

  return results;
};

const getProductsInfoBySearchTerm = async (searchTerm) => {
  const products = await getProductsBySearchTerm(searchTerm);

  const parsedProducts = products.map((product) => {
    const { productId, productName, link, description } = product;
    const price = await getPriceBySKU(productId).basePrice;
    return {
      productId,
      productName,
      link,
      description,
      price,
    };
  });

  return parsedProducts;
};

// TODO getProductsInfoByCategory

module.exports = {
  getProductsBySearchTerm,
  getPriceBySKU,
  getProductsInfoBySearchTerm,
};
