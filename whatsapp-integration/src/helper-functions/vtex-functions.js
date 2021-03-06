const fetch = require("node-fetch");
require("dotenv").config();

const doVtexRequest = async (url) => {
  const appKey = process.env.VTEX_APP_KEY;
  const appToken = process.env.VTEX_APP_TOKEN;

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-VTEX-API-AppKey": appKey,
      "X-VTEX-API-AppToken": appToken,
    },
  };

  const response = await fetch(url, options);
  const results = await response.json();

  return results;
};

// The function that most other functions make use of to gather product information
// Search for products by search term
async function getProductsInfoBySearchTerm(searchTerm) {
  const url = `https://cosmetics2.vtexcommercestable.com.br/api/catalog_system/pub/products/search/${searchTerm}`;

  const products = await doVtexRequest(url);

  const parsedProducts = products.map((product) => {
    const { productName, link, description, productId } = product;
    const imageUrl = product.items[0].images[0].imageUrl;
    const addToCartLink = product.items[0].sellers[0].addToCartLink;
    const price = product.items[0].sellers[0].commertialOffer.Price.toFixed(2);
    return {
      productId,
      productName,
      link,
      description,
      imageUrl,
      addToCartLink,
      price,
    };
  });

  return parsedProducts;
}

// Get useful information of all items in a category
async function getProductsByCategoryId(categoryId, maxAmount) {
  const url = `
    https://cosmetics2.vtexcommercestable.com.br/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=1&_to=10&categoryId=${categoryId}
  `;

  const products = await doVtexRequest(url);

  let parsedProducts = [];

  let productsCount = 0;

  for (productId in products.data) {
    try {
      const product = await getProductInfoById(productId);
      if (product && product.productName != "Order Tracker") {
        parsedProducts.push(product);
        productsCount++;
        if (productsCount >= maxAmount) break;
      }
    } catch (err) {
      console.error(`Product id ${productId} is broken. Error: ${err}`);
    }
  }

  return parsedProducts;
}

async function getSKUIdByProductId(productId) {
  const url = `https://cosmetics2.vtexcommercestable.com.br/api/catalog_system/pvt/sku/stockkeepingunitByProductId/${productId}`;

  const result = await doVtexRequest(url);

  return result[0].Id;
}

async function getPriceBySKUId(SKUId) {
  const url = `https://api.vtex.com/cosmetics2/pricing/prices/${SKUId}`;

  const result = await doVtexRequest(url);

  return result.costPrice;
}

async function getProductInfoById(productId) {
  try {
    const url = `https://cosmetics2.vtexcommercestable.com.br/api/catalog/pvt/product/${productId}`;

    const product = await doVtexRequest(url);
    // For some obscure reason, Vtex API doesn't provide all product information int the 'product' endpoint ?????????????
    //  So I need to search for the item name and then get more info, like add to cart link, or image link, or the link to the store

    // Of course, I'm assuming that no products have the same name
    const productWithBetterInfo = await getProductsInfoBySearchTerm(
      product.Name
    );

    return productWithBetterInfo[0];
  } catch {
    return { error: `Product with Id ${product.Id} not found` };
  }
}

// Get all categories' names and IDs
async function getAllCategories() {
  const url = `https://cosmetics2.vtexcommercestable.com.br/api/catalog_system/pub/category/tree/10`;

  const categories = await doVtexRequest(url);

  let allCategories = [];

  const addChildren = (category) => {
    if (!category.hasChildren) return;

    for (const child of category.children) {
      allCategories.push(child);
      addChildren(child);
    }
  };

  for (const category of categories) {
    allCategories.push(category);
    addChildren(category);
  }

  allCategories.sort((a, b) => a.id - b.id);

  return allCategories;
}

// ------------ TESTS -------------

async function test() {
  // const categories = await getAllCategories();
  // categories.forEach((category) => {
  //   console.log(`Name: ${category.name}. ID: ${category.id}\n`);
  // });
  // const products = await getProductsByCategoryId(1);
  // console.log(products);
  const result = await getProductsByCategoryId(1, 4);
  console.log(result);
}

// test();

module.exports = {
  getProductsInfoBySearchTerm,
  getProductsByCategoryId,
  getAllCategories,
  getProductInfoById,
  getPriceBySKUId,
  getSKUIdByProductId,
};
