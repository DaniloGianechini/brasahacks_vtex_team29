const fetch = require("node-fetch");

const doVtexRequest = async (url) => {
  const appKey = process.env.VTEX_APP_KEY;
  const appToken = process.env.VTEX_APP_TOKEN;

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json; charset=utf-8",
      "Content-Type": "application/json",
      "X-VTEX-API-AppKey": appKey,
      "X-VTEX-API-AppToken": appToken,
    },
  };

  const response = await fetch(url, options);
  const results = await response.json();

  return results;
};

const getProductsInfoBySearchTerm = async (searchTerm) => {
  const url = `https://cosmetics2.vtexcommercestable.com.br/api/catalog_system/pub/products/search/${searchTerm}`;

  const products = await doVtexRequest(url);

  const parsedProducts = products.map((product) => {
    // BUG I'm not sure, but maybe the productId is not the SKU, I don't know. For now I'll assume it isn't
    const { productName, link, description } = product;
    const imageUrl = product.items[0].images[0].imageUrl;
    const addToCartLink = product.items[0].sellers[0].addToCartLink;
    const price = product.items[0].sellers[0].commertialOffer.Price;
    return {
      productName,
      link,
      description,
      imageUrl,
      addToCartLink,
      price,
    };
  });

  return parsedProducts;
};

async function test() {
  const products = await getProductsInfoBySearchTerm("");
  console.log(products[0]);
}

module.exports = {
  getProductsInfoBySearchTerm,
};
