// Admin Mock Data Service
// This script provides fallback data for the admin dashboard when API is unavailable

console.log("📊 ADMIN MOCK: Mock data service initialized");

const AdminMockData = {
  // Mock user data
  users: [
    {
      id: 1,
      username: "admin",
      email: "admin@epharma.com",
      password: "-", // Password is hidden
      role: "admin",
      avatar: "../images/avatars/admin.jpg",
      registeredDate: "2023-01-15T09:30:00",
      lastLogin: "2023-05-10T14:22:10",
      active: true
    },
    {
      id: 2,
      username: "customer1",
      email: "customer1@example.com",
      password: "-", // Password is hidden
      role: "customer",
      avatar: "../images/avatars/user1.jpg",
      registeredDate: "2023-02-10T11:20:00",
      lastLogin: "2023-05-09T16:45:30",
      active: true
    },
    {
      id: 3,
      username: "pharmacist1",
      email: "pharmacist@epharma.com",
      password: "-", // Password is hidden
      role: "pharmacist",
      avatar: "../images/avatars/pharmacist.jpg",
      registeredDate: "2023-01-20T10:15:00",
      lastLogin: "2023-05-10T09:30:15",
      active: true
    },
    {
      id: 4,
      username: "customer2",
      email: "customer2@example.com",
      password: "-", // Password is hidden
      role: "customer",
      avatar: "../images/avatars/user2.jpg",
      registeredDate: "2023-03-05T15:40:00",
      lastLogin: "2023-05-08T18:20:45",
      active: false
    },
    {
      id: 5,
      username: "supplier1",
      email: "supplier@medco.com",
      password: "-", // Password is hidden
      role: "supplier",
      avatar: "../images/avatars/supplier.jpg",
      registeredDate: "2023-02-25T09:10:00",
      lastLogin: "2023-05-07T11:15:30",
      active: true
    }
  ],
  
  // Mock product data
  products: [
    {
      id: 1,
      name: "Paracetamol 500mg",
      category: "Pain Relief",
      price: 5.99,
      stock: 120,
      image: "../images/products/paracetamol.jpg",
      description: "Pain relief medication",
      manufacturer: "PharmaCorp",
      expiryDate: "2024-06-30"
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      category: "Antibiotics",
      price: 12.50,
      stock: 8,
      image: "../images/products/amoxicillin.jpg",
      description: "Antibiotic medication",
      manufacturer: "MedPharm",
      expiryDate: "2024-05-15"
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      category: "Vitamins",
      price: 8.75,
      stock: 200,
      image: "../images/products/vitaminc.jpg",
      description: "Immune support supplement",
      manufacturer: "NutriCare",
      expiryDate: "2025-01-20"
    },
    {
      id: 4,
      name: "Ibuprofen 400mg",
      category: "Pain Relief",
      price: 6.25,
      stock: 5,
      image: "../images/products/ibuprofen.jpg",
      description: "Anti-inflammatory medication",
      manufacturer: "PharmaCorp",
      expiryDate: "2024-08-12"
    },
    {
      id: 5,
      name: "Allergy Relief Tablets",
      category: "Allergies",
      price: 9.99,
      stock: 45,
      image: "../images/products/allergyrelief.jpg",
      description: "Antihistamine medication",
      manufacturer: "MedPharm",
      expiryDate: "2024-10-05"
    }
  ],
  
  // Mock orders data
  orders: [
    {
      id: 1,
      orderNumber: "ORD-2023-001",
      customerName: "John Doe",
      customerEmail: "customer1@example.com",
      date: "2023-05-10T09:15:30",
      status: "Delivered",
      total: 28.74,
      items: [
        { productId: 1, name: "Paracetamol 500mg", quantity: 2, price: 5.99 },
        { productId: 3, name: "Vitamin C 1000mg", quantity: 2, price: 8.75 }
      ]
    },
    {
      id: 2,
      orderNumber: "ORD-2023-002",
      customerName: "Jane Smith",
      customerEmail: "customer2@example.com",
      date: "2023-05-09T14:20:45",
      status: "Processing",
      total: 24.99,
      items: [
        { productId: 2, name: "Amoxicillin 250mg", quantity: 2, price: 12.50 }
      ]
    },
    {
      id: 3,
      orderNumber: "ORD-2023-003",
      customerName: "Michael Brown",
      customerEmail: "michael@example.com",
      date: "2023-05-08T11:30:15",
      status: "Shipped",
      total: 31.23,
      items: [
        { productId: 4, name: "Ibuprofen 400mg", quantity: 1, price: 6.25 },
        { productId: 5, name: "Allergy Relief Tablets", quantity: 2, price: 9.99 },
        { productId: 1, name: "Paracetamol 500mg", quantity: 1, price: 5.99 }
      ]
    },
    {
      id: 4,
      orderNumber: "ORD-2023-004",
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      date: "2023-05-07T16:45:20",
      status: "Cancelled",
      total: 17.50,
      items: [
        { productId: 3, name: "Vitamin C 1000mg", quantity: 2, price: 8.75 }
      ]
    },
    {
      id: 5,
      orderNumber: "ORD-2023-005",
      customerName: "Robert Wilson",
      customerEmail: "robert@example.com",
      date: "2023-05-06T10:05:30",
      status: "Delivered",
      total: 36.48,
      items: [
        { productId: 1, name: "Paracetamol 500mg", quantity: 2, price: 5.99 },
        { productId: 2, name: "Amoxicillin 250mg", quantity: 2, price: 12.50 }
      ]
    }
  ],
  
  // Mock dashboard statistics
  dashboardStats: {
    totalSales: 12850.75,
    totalOrders: 453,
    totalCustomers: 215,
    totalProducts: 87,
    lowStockProducts: 8,
    pendingOrders: 12,
    salesGrowth: 15.4,
    topProduct: "Paracetamol 500mg",
    topCategory: "Pain Relief"
  },
  
  // Mock inventory alerts
  inventoryAlerts: [
    {
      id: 2,
      name: "Amoxicillin 250mg",
      category: "Antibiotics",
      stock: 8,
      threshold: 10,
      status: "Low Stock"
    },
    {
      id: 4,
      name: "Ibuprofen 400mg",
      category: "Pain Relief",
      stock: 5, 
      threshold: 15,
      status: "Critical"
    },
    {
      id: 8,
      name: "Children's Cough Syrup",
      category: "Cold & Flu",
      stock: 7,
      threshold: 10,
      status: "Low Stock"
    },
    {
      id: 12,
      name: "Blood Pressure Monitor",
      category: "Devices",
      stock: 3,
      threshold: 5,
      status: "Low Stock"
    }
  ]
};

// Expose the mock data to the window
window.AdminMockData = AdminMockData;
