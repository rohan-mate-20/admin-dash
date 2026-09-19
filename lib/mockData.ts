export const mockEarningsData = [
  { time: "9 AM",  earnings: 800 },
  { time: "10 AM", earnings: 1400 },
  { time: "11 AM", earnings: 1800 },
  { time: "12 PM", earnings: 2600 },
  { time: "1 PM",  earnings: 3100 },
  { time: "2 PM",  earnings: 2800 },
  { time: "3 PM",  earnings: 3400 },
  { time: "4 PM",  earnings: 4200 },
  { time: "5 PM",  earnings: 5000 },
  { time: "6 PM",  earnings: 5800 },
  { time: "7 PM",  earnings: 7200 },
  { time: "8 PM",  earnings: 5600 },
  { time: "9 PM",  earnings: 3800 },
];

export const mockOrders = [
  { id: "KM1024", name: "Priya Sharma",   amount: 862,  store: "Store 1", status: "Pending",         time: "10:32 AM" },
  { id: "KM1023", name: "Rahul Verma",    amount: 1420, store: "Store 2", status: "Packed",           time: "09:15 AM" },
  { id: "KM1022", name: "Sneha Iyer",     amount: 540,  store: "Store 1", status: "Out for Delivery", time: "08:50 AM" },
  { id: "KM1021", name: "Amit Patil",     amount: 2180, store: "Store 2", status: "Delivered",        time: "07:20 AM" },
  { id: "KM1020", name: "Neha Kulkarni",  amount: 730,  store: "Store 1", status: "Cancelled",        time: "05:12 AM" },
];

export const mockProducts = [
  {
    name: "Aashirvaad Atta", size: "5 kg",    sku: "KM001", category: "Atta & Flour", store: "Store 1", stock: 120, price: 290,
    color: "#F97316", emoji: "🌾",
  },
  {
    name: "Colgate Toothpaste", size: "200 g", sku: "KM002", category: "Oral Care",   store: "Store 1", stock: 85,  price: 120,
    color: "#3B82F6", emoji: "🦷",
  },
  {
    name: "Amul Butter",      size: "100 g",  sku: "KM003", category: "Dairy",        store: "Store 2", stock: 60,  price: 55,
    color: "#FBBF24", emoji: "🧈",
  },
  {
    name: "Soya Bean",        size: "1 kg",   sku: "KM004", category: "Pulses",       store: "Store 1", stock: 78,  price: 180,
    color: "#84CC16", emoji: "🫘",
  },
  {
    name: "Surf Excel",       size: "1 kg",   sku: "KM005", category: "Cleaning",     store: "Store 2", stock: 45,  price: 240,
    color: "#6366F1", emoji: "🧺",
  },
  {
    name: "Maggi 2 Min Noodles", size: "70 g", sku: "KM006", category: "Snacks",      store: "Store 1", stock: 150, price: 70,
    color: "#EF4444", emoji: "🍜",
  },
  {
    name: "Dove Shampoo",     size: "340 ml", sku: "KM007", category: "Hair Care",    store: "Store 2", stock: 95,  price: 245,
    color: "#EC4899", emoji: "🧴",
  },
  {
    name: "Tata Salt",        size: "1 kg",   sku: "KM008", category: "Grocery",      store: "Store 1", stock: 200, price: 28,
    color: "#64748B", emoji: "🧂",
  },
  {
    name: "Santoor Soap",     size: "125 g",  sku: "KM009", category: "Personal Care",store: "Store 2", stock: 0,   price: 35,
    color: "#14B8A6", emoji: "🧼",
  },
];

export const mockTeam = [
  { name: "Ravi Kumar",    email: "ravi@kmart.com",    role: "Packer",   store: "Store 1" },
  { name: "Suresh Nair",   email: "suresh@kmart.com",  role: "Packer",   store: "Store 2" },
  { name: "Amit Shah",     email: "amit@kmart.com",    role: "Delivery", store: "Store 1" },
  { name: "Vikram Patil",  email: "vikram@kmart.com",  role: "Delivery", store: "Store 2" },
  { name: "Pooja Desai",   email: "pooja@kmart.com",   role: "Packer",   store: "Store 1" },
  { name: "Imran Shaikh",  email: "imran@kmart.com",   role: "Delivery", store: "Store 2" },
];
