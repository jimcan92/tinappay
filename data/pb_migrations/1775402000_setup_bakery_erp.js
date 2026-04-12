/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Categories
  const categories = new Collection({
    "name": "categories",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });
  
  const catName = new TextField();
  catName.name = "name";
  catName.required = true;
  categories.fields.add(catName);

  const catSlug = new TextField();
  catSlug.name = "slug";
  catSlug.required = true;
  categories.fields.add(catSlug);

  const catType = new SelectField();
  catType.name = "type";
  catType.values = ["product", "ingredient"];
  catType.required = true;
  categories.fields.add(catType);

  app.save(categories);

  // 2. Products
  const products = new Collection({
    "name": "products",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });

  const prdName = new TextField();
  prdName.name = "name";
  prdName.required = true;
  products.fields.add(prdName);

  const prdDesc = new TextField();
  prdDesc.name = "description";
  products.fields.add(prdDesc);

  const prdPrice = new NumberField();
  prdPrice.name = "price";
  prdPrice.required = true;
  products.fields.add(prdPrice);

  const prdCat = new RelationField();
  prdCat.name = "category";
  prdCat.collectionId = categories.id;
  prdCat.maxSelect = 1;
  prdCat.required = true;
  products.fields.add(prdCat);

  const prdImg = new FileField();
  prdImg.name = "image";
  prdImg.maxSelect = 1;
  prdImg.mimeTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"];
  products.fields.add(prdImg);

  const prdStock = new NumberField();
  prdStock.name = "stock";
  products.fields.add(prdStock);

  const prdActive = new BoolField();
  prdActive.name = "active";
  products.fields.add(prdActive);

  app.save(products);

  // 3. Ingredients
  const ingredients = new Collection({
    "name": "ingredients",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });

  const ingName = new TextField();
  ingName.name = "name";
  ingName.required = true;
  ingredients.fields.add(ingName);

  const ingDesc = new TextField();
  ingDesc.name = "description";
  ingredients.fields.add(ingDesc);

  const ingUnit = new TextField();
  ingUnit.name = "unit";
  ingUnit.required = true;
  ingredients.fields.add(ingUnit);

  const ingStock = new NumberField();
  ingStock.name = "current_stock";
  ingStock.required = true;
  ingredients.fields.add(ingStock);

  const ingMin = new NumberField();
  ingMin.name = "min_stock";
  ingMin.required = true;
  ingredients.fields.add(ingMin);

  const ingMax = new NumberField();
  ingMax.name = "max_stock";
  ingMax.required = true;
  ingredients.fields.add(ingMax);

  const ingCat = new RelationField();
  ingCat.name = "category";
  ingCat.collectionId = categories.id;
  ingCat.maxSelect = 1;
  ingredients.fields.add(ingCat);

  const ingImg = new FileField();
  ingImg.name = "image";
  ingImg.maxSelect = 1;
  ingImg.mimeTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"];
  ingredients.fields.add(ingImg);

  app.save(ingredients);

  // 4. Suppliers
  const suppliers = new Collection({
    "name": "suppliers",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });

  const supName = new TextField();
  supName.name = "name";
  supName.required = true;
  suppliers.fields.add(supName);

  const supContact = new TextField();
  supContact.name = "contact_person";
  suppliers.fields.add(supContact);

  const supPhone = new TextField();
  supPhone.name = "phone";
  suppliers.fields.add(supPhone);

  const supEmail = new EmailField();
  supEmail.name = "email";
  suppliers.fields.add(supEmail);

  const supCats = new TextField();
  supCats.name = "categories";
  suppliers.fields.add(supCats);

  const supImg = new FileField();
  supImg.name = "image";
  supImg.maxSelect = 1;
  supImg.mimeTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"];
  suppliers.fields.add(supImg);

  app.save(suppliers);

  // 5. Orders
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  const orders = new Collection({
    "name": "orders",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });

  const ordTotal = new NumberField();
  ordTotal.name = "total";
  ordTotal.required = true;
  orders.fields.add(ordTotal);

  const ordStatus = new SelectField();
  ordStatus.name = "status";
  ordStatus.values = ["completed", "cancelled"];
  orders.fields.add(ordStatus);

  const ordCashier = new RelationField();
  ordCashier.name = "cashier";
  ordCashier.collectionId = users.id;
  ordCashier.maxSelect = 1;
  ordCashier.required = true;
  orders.fields.add(ordCashier);

  app.save(orders);

  // 6. Order Items
  const order_items = new Collection({
    "name": "order_items",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });

  const itmOrder = new RelationField();
  itmOrder.name = "order";
  itmOrder.collectionId = orders.id;
  itmOrder.maxSelect = 1;
  itmOrder.required = true;
  itmOrder.cascadeDelete = true;
  order_items.fields.add(itmOrder);

  const itmProd = new RelationField();
  itmProd.name = "product";
  itmProd.collectionId = products.id;
  itmProd.maxSelect = 1;
  itmProd.required = true;
  order_items.fields.add(itmProd);

  const itmQty = new NumberField();
  itmQty.name = "quantity";
  itmQty.required = true;
  order_items.fields.add(itmQty);

  const itmPrice = new NumberField();
  itmPrice.name = "price";
  itmPrice.required = true;
  order_items.fields.add(itmPrice);

  const itmSub = new NumberField();
  itmSub.name = "subtotal";
  itmSub.required = true;
  order_items.fields.add(itmSub);

  app.save(order_items);

  // 7. Inventory Logs
  const inventory_logs = new Collection({
    "name": "inventory_logs",
    "type": "base",
    "listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""
  });

  const logProd = new RelationField();
  logProd.name = "product";
  logProd.collectionId = products.id;
  logProd.maxSelect = 1;
  inventory_logs.fields.add(logProd);

  const logIng = new RelationField();
  logIng.name = "ingredient";
  logIng.collectionId = ingredients.id;
  logIng.maxSelect = 1;
  inventory_logs.fields.add(logIng);

  const logQty = new NumberField();
  logQty.name = "quantity";
  logQty.required = true;
  inventory_logs.fields.add(logQty);

  const logReason = new SelectField();
  logReason.name = "reason";
  logReason.values = ["sale", "restock", "waste", "adjustment"];
  logReason.required = true;
  inventory_logs.fields.add(logReason);

  const logUser = new RelationField();
  logUser.name = "user";
  logUser.collectionId = users.id;
  logUser.maxSelect = 1;
  inventory_logs.fields.add(logUser);

  return app.save(inventory_logs);

}, (app) => {
  const collections = ["inventory_logs", "order_items", "orders", "suppliers", "ingredients", "products", "categories"];
  for (const name of collections) {
    const collection = app.findCollectionByNameOrId(name);
    if (collection) app.delete(collection);
  }
})
