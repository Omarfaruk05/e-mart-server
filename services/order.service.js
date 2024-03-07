const { ObjectId } = require("mongodb");
const { productSearchableFildes } = require("../constants/product.constants");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { default: axios } = require("axios");

exports.createOrderService = async (order) => {
  const tran_id = new ObjectId().toString();
  const data = {
    store_id: process.env.store_id,
    store_passwd: process.env.store_passwd,
    total_amount: order?.totalAmount,
    currency: "BDT",
    tran_id: tran_id,
    success_url: "http://localhost:3000/receipt",
    fail_url: "http://localhost:3000/fail",
    cancel_url: "http://localhost:3030/cancel",
    ipn_url: "http://localhost:3030/ipn",
    shipping_method: "Courier",
    product_name: "Computer.",
    product_category: "Electronic",
    product_profile: "general",
    cus_name: `${order?.firstName}${order?.lastName}`,
    cus_email: order?.email,
    cus_add1: order?.address,
    cus_add2: "Dhaka",
    cus_city: order?.town,
    cus_state: order?.state,
    cus_postcode: order?.postOrZipCode,
    cus_country: "Bangladesh",
    cus_phone: order?.contactNumber,
  };
  order.user = order?._id;
  delete order._id;
  const orderData = {
    totalAmount: order?.totalAmount,
    user: order?.user,
    products: order?.products,
    paidStatus: "PENDING",
    transectionId: tran_id,
  };

  await Order.create(orderData);

  const response = await axios({
    method: "POST",
    url: "https://sandbox.sslcommerz.com/gwprocess/v3/api.php",
    data,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data?.redirectGatewayURL;
};

exports.webhook = async (payload) => {
  const result = await axios({
    method: "GET",
    url: `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${payload.val_id}&store_id=${process.env.store_id}&store_passwd=${process.env.store_passwd}&formate=json`,
  });

  if (result?.data?.status === "INVALID_TRANSACTION") {
    return "Payment failed";
  }

  const { tran_id } = result?.data;

  await Order.findOneAndUpdate(
    { tran_id },
    { paidStatus: "SUCCESS" },
    { new: true }
  );

  return "Payment Success";
};

exports.getStockService = async (data) => {
  const result = await Product.find({ category: data }).limit();
  return result;
};
exports.getAllProductsService = async (filters) => {
  const { searchTerm, limit, minPrice, maxPrice, ...filtersData } = filters;

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      $or: productSearchableFildes.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: "i",
        },
      })),
    });
  }

  if (minPrice && !maxPrice) {
    andConditions.push({
      $and: [{ price: { $gte: Number(minPrice) } }],
    });
  }

  if (!minPrice && maxPrice) {
    andConditions.push({
      $and: [{ price: { $lte: Number(maxPrice) } }],
    });
  }

  if (minPrice && maxPrice) {
    andConditions.push({
      $and: [{ price: { $gte: Number(minPrice), $lte: Number(maxPrice) } }],
    });
  }

  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await Product.find(whereConditions).limit(limit);

  return result;
};
exports.getProductById = async (id) => {
  const result = await Product.findOne({ _id: id });
  return result;
};
