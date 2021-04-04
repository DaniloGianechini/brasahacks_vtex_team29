// TODO There is still no exchange of information between actions. In the future, this needs to be implemented

// Define actions to the interactions
// Each action receives its own interaction and the user input. It then must returns the array of messages to be sent to the user
//   The action must also return, in the last index of the array, the interaction identifierMessage

const vtexFunctions = require("./helper-functions/vtex-functions");

async function handleSearchOption(
  currentInteraction,
  nextInteraction,
  userInput
) {
  const results = await vtexFunctions.getProductsInfoBySearchTerm(userInput);

  // No results found, return
  if (!results.length) {
    return [
      "Oops, nenhum produto foi encontrado. Tente novamente",
      ...currentInteraction.body,
    ];
  }

  const messages = results.reduce((finalArray, product) => {
    finalArray.push(
      `_IMG_LINK:${product.imageUrl}`,
      `ID: *${product.productId}*\n\n_${product.productName}_\n${product.description}`
    );
    return finalArray;
  }, []);

  return [...messages, ...nextInteraction.identifierMessage];
}

async function handleProductInfo(
  currentInteraction,
  nextInteraction,
  userInput
) {
  let product = await vtexFunctions.getProductInfoById(userInput);
  // BUG
  // If the user types something wrong there is still no error handling here, and in the future it must be implemented

  const messages = [
    `_IMG_URL:${product.imageUrl}`,
    `_${product.productName}_\n\n${product.description}\n_R$ ${product.price}_\n\nIr para a página do produto: ${product.link}\nAdicionar ao carrinho: ${product.addToCartLink}\n\n`,
  ];

  return [...messages, ...nextInteraction.identifierMessage];
}

async function handleCategorySearch(
  currentInteraction,
  nextInteraction,
  userInput
) {
  const categories = await vtexFunctions.getAllCategories();

  let messages = ["Escolha uma das seguintes categorias: "];

  categories.forEach((category) => {
    messages.push(
      `ID: *${category.id}*\n\n${category.name}\nAcessar página da categoria: ${category.url}`
    );
  });

  return [...messages, ...nextInteraction.identifierMessage];
}

async function handleCategoryProducts(
  currentInteraction,
  nextInteraction,
  userInput
) {
  const results = await vtexFunctions.getProductsByCategoryId(userInput, 5);

  const messages = results.reduce((finalArray, product) => {
    finalArray.push(
      `_IMG_LINK:${product.imageUrl}`,
      `ID: *${product.productId}*\n\n_${product.productName}_\n${product.description}`
    );
    return finalArray;
  }, []);

  return [...messages, ...nextInteraction.identifierMessage];
}

async function test() {
  await handleCategorySearch();
}

module.exports = {
  searchResults: {
    interactionName: "search-results",
    func: handleSearchOption,
  },
  productInfo: {
    interactionName: "product-info",
    func: handleProductInfo,
  },
  categories: {
    interactionName: "categories",
    func: handleCategorySearch,
  },
  categoryProducts: {
    interactionName: "category-products",
    func: handleCategoryProducts,
  },
};
