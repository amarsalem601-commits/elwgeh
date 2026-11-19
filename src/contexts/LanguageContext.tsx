import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // Auth
  'login.title': { ar: 'تسجيل الدخول', en: 'Login' },
  'login.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'login.password': { ar: 'كلمة المرور', en: 'Password' },
  'login.submit': { ar: 'دخول', en: 'Sign In' },
  'login.error': { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Invalid email or password' },
  'login.welcome': { ar: 'مرحباً بك في نظام الوجيه', en: 'Welcome to El Wageh System' },
  'login.subtitle': { ar: 'نظام إدارة منظمات الهواء', en: 'Air Regulator Management System' },
  'logout': { ar: 'تسجيل الخروج', en: 'Logout' },

  // Signup
  'signup.title': { ar: 'إنشاء حساب', en: 'Create Account' },
  'signup.subtitle': { ar: 'سجل كموظف جديد', en: 'Register as a new employee' },
  'signup.name': { ar: 'الاسم الكامل', en: 'Full Name' },
  'signup.phone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'signup.submit': { ar: 'إنشاء حساب', en: 'Create Account' },
  'signup.link': { ar: 'ليس لديك حساب؟ سجل الآن', en: "Don't have an account? Sign up" },
  'signup.loginLink': { ar: 'لديك حساب بالفعل؟ سجل دخول', en: 'Already have an account? Login' },
  'signup.error': { ar: 'حدث خطأ أثناء التسجيل', en: 'Error during registration' },

  // Sidebar
  'nav.dashboard': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'nav.aiAssistant': { ar: 'المساعد الذكي', en: 'AI Assistant' },
  'nav.adminDashboard': { ar: 'لوحة الأدمن', en: 'Admin Dashboard' },
  'nav.products': { ar: 'المنتجات', en: 'Products' },
  'nav.sales': { ar: 'المبيعات', en: 'Sales' },
  'nav.purchases': { ar: 'المشتريات', en: 'Purchases' },
  'nav.inventory': { ar: 'المخزون', en: 'Inventory' },
  'nav.reports': { ar: 'التقارير', en: 'Reports' },
  'nav.customers': { ar: 'العملاء', en: 'Customers' },
  'nav.suppliers': { ar: 'الموردين', en: 'Suppliers' },
  'nav.employees': { ar: 'الموظفين', en: 'Employees' },
  'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
  'nav.attendance': { ar: 'الحضور والانصراف', en: 'Attendance' },
  'nav.location': { ar: 'تتبع المواقع', en: 'Location Tracking' },
  'nav.expenses': { ar: 'المصروفات', en: 'Expenses' },
  'nav.salaries': { ar: 'الرواتب', en: 'Salaries' },
  'nav.tasks': { ar: 'المهام', en: 'Tasks' },
  'nav.notifications': { ar: 'الإشعارات', en: 'Notifications' },

  // Dashboard
  'dashboard.title': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'dashboard.totalProducts': { ar: 'إجمالي المنتجات', en: 'Total Products' },
  'dashboard.totalSales': { ar: 'إجمالي المبيعات', en: 'Total Sales' },
  'dashboard.totalRevenue': { ar: 'إجمالي الإيرادات', en: 'Total Revenue' },
  'dashboard.lowStock': { ar: 'مخزون منخفض', en: 'Low Stock' },
  'dashboard.recentOrders': { ar: 'الطلبات الأخيرة', en: 'Recent Orders' },
  'dashboard.lowStockAlerts': { ar: 'تنبيهات المخزون المنخفض', en: 'Low Stock Alerts' },
  'dashboard.revenueChart': { ar: 'إحصائيات الإيرادات', en: 'Revenue Statistics' },

  // Products
  'products.title': { ar: 'إدارة المنتجات', en: 'Product Management' },
  'products.add': { ar: 'إضافة منتج', en: 'Add Product' },
  'products.edit': { ar: 'تعديل', en: 'Edit' },
  'products.delete': { ar: 'حذف', en: 'Delete' },
  'products.name': { ar: 'اسم المنتج', en: 'Product Name' },
  'products.price': { ar: 'السعر', en: 'Price' },
  'products.quantity': { ar: 'الكمية', en: 'Quantity' },
  'products.status': { ar: 'الحالة', en: 'Status' },
  'products.available': { ar: 'متوفر', en: 'Available' },
  'products.unavailable': { ar: 'غير متوفر', en: 'Unavailable' },
  'products.category': { ar: 'الفئة', en: 'Category' },
  'products.search': { ar: 'بحث عن منتج...', en: 'Search products...' },

  // Sales
  'sales.title': { ar: 'إدارة المبيعات', en: 'Sales Management' },
  'sales.newOrder': { ar: 'طلب جديد', en: 'New Order' },
  'sales.orderId': { ar: 'رقم الطلب', en: 'Order ID' },
  'sales.customer': { ar: 'العميل', en: 'Customer' },
  'sales.date': { ar: 'التاريخ', en: 'Date' },
  'sales.total': { ar: 'الإجمالي', en: 'Total' },
  'sales.status': { ar: 'الحالة', en: 'Status' },
  'sales.completed': { ar: 'مكتمل', en: 'Completed' },
  'sales.pending': { ar: 'قيد الانتظار', en: 'Pending' },
  'sales.cancelled': { ar: 'ملغي', en: 'Cancelled' },
  'sales.product': { ar: 'المنتج', en: 'Product' },
  'sales.quantity': { ar: 'الكمية', en: 'Quantity' },
  'sales.price': { ar: 'السعر', en: 'Price' },

  // Purchases
  'purchases.title': { ar: 'إدارة المشتريات', en: 'Purchase Management' },
  'purchases.newOrder': { ar: 'طلب شراء جديد', en: 'New Purchase' },
  'purchases.supplier': { ar: 'المورد', en: 'Supplier' },

  // Inventory
  'inventory.title': { ar: 'إدارة المخزون', en: 'Inventory Management' },
  'inventory.product': { ar: 'المنتج', en: 'Product' },
  'inventory.currentStock': { ar: 'المخزون الحالي', en: 'Current Stock' },
  'inventory.minStock': { ar: 'الحد الأدنى', en: 'Min Stock' },
  'inventory.lastUpdated': { ar: 'آخر تحديث', en: 'Last Updated' },
  'inventory.addItem': { ar: 'إضافة عنصر', en: 'Add Item' },

  // Reports
  'reports.title': { ar: 'التقارير', en: 'Reports' },
  'reports.salesReport': { ar: 'تقرير المبيعات', en: 'Sales Report' },
  'reports.purchaseReport': { ar: 'تقرير المشتريات', en: 'Purchase Report' },
  'reports.inventoryReport': { ar: 'تقرير المخزون', en: 'Inventory Report' },
  'reports.profitSummary': { ar: 'ملخص الأرباح', en: 'Profit Summary' },

  // Customers
  'customers.title': { ar: 'إدارة العملاء', en: 'Customer Management' },
  'customers.add': { ar: 'إضافة عميل', en: 'Add Customer' },
  'customers.name': { ar: 'اسم العميل', en: 'Customer Name' },
  'customers.phone': { ar: 'الهاتف', en: 'Phone' },
  'customers.location': { ar: 'الموقع', en: 'Location' },

  // Suppliers
  'suppliers.title': { ar: 'إدارة الموردين', en: 'Supplier Management' },
  'suppliers.add': { ar: 'إضافة مورد', en: 'Add Supplier' },
  'suppliers.name': { ar: 'اسم المورد', en: 'Supplier Name' },
  'suppliers.contact': { ar: 'جهة الاتصال', en: 'Contact' },
  'suppliers.phone': { ar: 'الهاتف', en: 'Phone' },
  'suppliers.location': { ar: 'الموقع', en: 'Location' },

  // Employees
  'employees.noEmployees': { ar: 'لا يوجد موظفين مسجلين بعد', en: 'No employees registered yet' },
  'employees.noName': { ar: 'بدون اسم', en: 'No name' },
  'employees.permissions': { ar: 'الصلاحيات', en: 'Permissions' },
  'employees.noPermissionsShort': { ar: 'لا توجد صلاحيات', en: 'No permissions' },
  'employees.managePermissions': { ar: 'الصلاحيات', en: 'Permissions' },
  'employees.permissionsFor': { ar: 'صلاحيات', en: 'Permissions for' },
  'employees.permissionsSaved': { ar: 'تم حفظ الصلاحيات', en: 'Permissions saved' },
  'employees.deleted': { ar: 'تم حذف الموظف', en: 'Employee deleted' },
  'employees.assignedPages': { ar: 'الصفحات المخصصة', en: 'Assigned Pages' },

  // Employee dashboard
  'employee.welcome': { ar: 'مرحباً بك', en: 'Welcome' },
  'employee.dashboard': { ar: 'لوحة تحكم الموظف', en: 'Employee Dashboard' },
  'employee.noPermissions': { ar: 'لم يتم تخصيص أي صفحات لك بعد', en: 'No pages have been assigned to you yet' },
  'employee.contactAdmin': { ar: 'تواصل مع المدير لتخصيص الصلاحيات', en: 'Contact the admin to assign permissions' },

  // Attendance
  'attendance.title': { ar: 'الحضور والانصراف', en: 'Attendance' },
  'attendance.checkIn': { ar: 'تسجيل حضور', en: 'Check In' },
  'attendance.checkOut': { ar: 'تسجيل انصراف', en: 'Check Out' },
  'attendance.history': { ar: 'سجل الحضور', en: 'Attendance History' },
  'attendance.photo': { ar: 'صورة التسجيل', en: 'Check-in Photo' },
  'attendance.location': { ar: 'الموقع', en: 'Location' },
  'attendance.time': { ar: 'الوقت', en: 'Time' },
  'attendance.type': { ar: 'النوع', en: 'Type' },
  'attendance.employee': { ar: 'الموظف', en: 'Employee' },
  'attendance.takePhoto': { ar: 'التقط صورة', en: 'Take Photo' },
  'attendance.capturing': { ar: 'جاري التسجيل...', en: 'Capturing...' },
  'attendance.success': { ar: 'تم التسجيل بنجاح', en: 'Recorded successfully' },
  'attendance.noRecords': { ar: 'لا توجد سجلات', en: 'No records' },
  'attendance.today': { ar: 'اليوم', en: 'Today' },

  // Location
  'location.title': { ar: 'تتبع المواقع', en: 'Location Tracking' },
  'location.employee': { ar: 'الموظف', en: 'Employee' },
  'location.lastSeen': { ar: 'آخر ظهور', en: 'Last Seen' },
  'location.coordinates': { ar: 'الإحداثيات', en: 'Coordinates' },
  'location.tracking': { ar: 'التتبع مفعل', en: 'Tracking Active' },
  'location.noData': { ar: 'لا توجد بيانات موقع', en: 'No location data' },

  // Expenses
  'expenses.title': { ar: 'إدارة المصروفات', en: 'Expense Management' },
  'expenses.add': { ar: 'إضافة مصروف', en: 'Add Expense' },
  'expenses.amount': { ar: 'المبلغ', en: 'Amount' },
  'expenses.category': { ar: 'الفئة', en: 'Category' },
  'expenses.notes': { ar: 'ملاحظات', en: 'Notes' },
  'expenses.date': { ar: 'التاريخ', en: 'Date' },
  'expenses.total': { ar: 'إجمالي المصروفات', en: 'Total Expenses' },

  // Salaries
  'salaries.title': { ar: 'إدارة الرواتب', en: 'Salary Management' },
  'salaries.add': { ar: 'إضافة راتب', en: 'Add Salary' },
  'salaries.employee': { ar: 'الموظف', en: 'Employee' },
  'salaries.amount': { ar: 'الراتب الأساسي', en: 'Base Salary' },
  'salaries.bonus': { ar: 'المكافأة', en: 'Bonus' },
  'salaries.deductions': { ar: 'الخصومات', en: 'Deductions' },
  'salaries.net': { ar: 'صافي الراتب', en: 'Net Salary' },
  'salaries.month': { ar: 'الشهر', en: 'Month' },
  'salaries.paid': { ar: 'مدفوع', en: 'Paid' },
  'salaries.unpaid': { ar: 'غير مدفوع', en: 'Unpaid' },
  'salaries.markPaid': { ar: 'تأكيد الدفع', en: 'Mark as Paid' },

  // Tasks
  'tasks.title': { ar: 'إدارة المهام', en: 'Task Management' },
  'tasks.add': { ar: 'إضافة مهمة', en: 'Add Task' },
  'tasks.assignTo': { ar: 'تعيين إلى', en: 'Assign To' },
  'tasks.description': { ar: 'الوصف', en: 'Description' },
  'tasks.status': { ar: 'الحالة', en: 'Status' },
  'tasks.priority': { ar: 'الأولوية', en: 'Priority' },
  'tasks.dueDate': { ar: 'تاريخ الاستحقاق', en: 'Due Date' },
  'tasks.pending': { ar: 'قيد الانتظار', en: 'Pending' },
  'tasks.inProgress': { ar: 'قيد التنفيذ', en: 'In Progress' },
  'tasks.completed': { ar: 'مكتمل', en: 'Completed' },
  'tasks.low': { ar: 'منخفضة', en: 'Low' },
  'tasks.medium': { ar: 'متوسطة', en: 'Medium' },
  'tasks.high': { ar: 'عالية', en: 'High' },

  // Notifications
  'notifications.title': { ar: 'الإشعارات', en: 'Notifications' },
  'notifications.send': { ar: 'إرسال إشعار', en: 'Send Notification' },
  'notifications.message': { ar: 'الرسالة', en: 'Message' },
  'notifications.to': { ar: 'إلى', en: 'To' },
  'notifications.read': { ar: 'مقروء', en: 'Read' },
  'notifications.unread': { ar: 'غير مقروء', en: 'Unread' },
  'notifications.markRead': { ar: 'تحديد كمقروء', en: 'Mark as Read' },
  'notifications.noNotifications': { ar: 'لا توجد إشعارات', en: 'No notifications' },

  // Settings
  'settings.appearance': { ar: 'المظهر', en: 'Appearance' },
  'settings.language': { ar: 'اللغة', en: 'Language' },

  // General
  'currency': { ar: 'ج.م', en: 'EGP' },
  'save': { ar: 'حفظ', en: 'Save' },
  'cancel': { ar: 'إلغاء', en: 'Cancel' },
  'required': { ar: 'هذا الحقل مطلوب أو يحتوي على قيمة غير صالحة', en: 'Required fields must contain valid values' },
  'confirm': { ar: 'تأكيد', en: 'Confirm' },
  'actions': { ar: 'الإجراءات', en: 'Actions' },
  'noData': { ar: 'لا توجد بيانات', en: 'No data available' },
  'lightMode': { ar: 'فاتح', en: 'Light' },
  'darkMode': { ar: 'غامق', en: 'Dark' },
  'language': { ar: 'English', en: 'العربية' },
  'admin': { ar: 'المدير', en: 'Admin' },
  'calculator': { ar: 'الآلة الحاسبة', en: 'Calculator' },
  'items': { ar: 'عنصر', en: 'items' },
  'order': { ar: 'طلب', en: 'order' },
  'title': { ar: 'عنوان', en: 'Title' },
  'delete': { ar: 'حذف', en: 'Delete' },
  'all': { ar: 'الكل', en: 'All' },
  'nav.repairs': { ar: 'حجوزات الإصلاح', en: 'Repair Bookings' },
  'nav.bookings': { ar: 'الحجوزات والإصلاح', en: 'Bookings & Repairs' },
  'nav.repairDesign': { ar: 'تصميم صفحة الحجز', en: 'Booking Page Design' },
  'nav.invoices': { ar: 'الفواتير', en: 'Invoices' },
  'nav.accounting': { ar: 'المحاسبة', en: 'Accounting' },
  'nav.warehouses': { ar: 'المخازن', en: 'Warehouses' },
  'nav.crm': { ar: 'العملاء المحتملين', en: 'CRM' },
  'nav.profile': { ar: 'الملف الشخصي', en: 'Profile' },
  'nav.database': { ar: 'قاعدة البيانات', en: 'Database' },
  'nav.profileManagement': { ar: 'إدارة الملفات الشخصية', en: 'Profile Management' },
  'nav.team': { ar: 'إدارة الفريق', en: 'Team Management' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'ar';
  });

  const isRTL = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
