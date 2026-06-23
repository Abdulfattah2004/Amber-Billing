import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';


type Language = 'en' | 'ar';

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  // Nav
  'nav.dashboard': { en: 'Customers', ar: 'العملاء' },
  'nav.addCustomer': { en: 'Add Customer', ar: 'إضافة عميل' },
  'nav.reports': { en: 'Reports', ar: 'التقارير' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات' },
  'nav.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
  'nav.amberSystem': { en: 'El Iman', ar: 'الإيمان' },
  
  // Login
  'login.title': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'login.subtitle': { en: 'El Iman Electricity Management', ar: 'إدارة كهرباء الإمان' },
  'login.username': { en: 'Username', ar: 'اسم المستخدم' },
  'login.password': { en: 'Password', ar: 'كلمة المرور' },
  'login.submit': { en: 'Sign In', ar: 'دخول' },
  'login.error': { en: 'Invalid credentials', ar: 'بيانات غير صحيحة' },

  // Customers
  'customers.title': { en: 'Customers', ar: 'العملاء' },
  'customers.search': { en: 'Search customers...', ar: 'بحث عن عميل...' },
  'customers.name': { en: 'Name', ar: 'الاسم' },
  'customers.address': { en: 'Address', ar: 'العنوان' },
  'customers.floor': { en: 'Floor', ar: 'الطابق' },
  'customers.phone': { en: 'Phone', ar: 'الهاتف' },
  'customers.type': { en: 'Type', ar: 'النوع' },
  'customers.usage': { en: 'Usage', ar: 'الاستهلاك' },
  'customers.price': { en: 'Price', ar: 'السعر' },
  'customers.status': { en: 'Status', ar: 'الحالة' },
  'customers.actions': { en: 'Actions', ar: 'إجراءات' },
  'customers.fixed': { en: 'Fixed', ar: 'ثابت' },
  'customers.counter': { en: 'Counter', ar: 'عداد' },
  'customers.paid': { en: 'Paid', ar: 'مدفوع' },
  'customers.unpaid': { en: 'Unpaid', ar: 'غير مدفوع' },
  'customers.late': { en: 'Late', ar: 'متأخر' },
  'customers.markPaid': { en: 'Mark Paid', ar: 'تحديد كمدفوع' },
  'customers.markUnpaid': { en: 'Mark Unpaid', ar: 'تحديد كغير مدفوع' },
  'customers.print': { en: 'Print', ar: 'طباعة' },
  'customers.delete': { en: 'Delete', ar: 'حذف' },
  'customers.edit': { en: 'Edit', ar: 'تعديل' },
  'customers.noCustomers': { en: 'No customers yet', ar: 'لا يوجد عملاء بعد' },
  'customers.enterUsage': { en: 'Enter usage (kWh)', ar: 'أدخل الاستهلاك (كيلوواط)' },
  'customers.total': { en: 'Total', ar: 'المجموع' },
  'customers.totalAmper': { en: 'Total Amper', ar: 'إجمالي الأمبير' },
  'customers.discount': { en: 'Discount', ar: 'الخصم' },
  'customers.finalPrice': { en: 'Final Price', ar: 'السعر النهائي' },

  // Add customer
  'add.title': { en: 'Add Customer', ar: 'إضافة عميل' },
  'add.firstName': { en: 'First Name', ar: 'الاسم الأول' },
  'add.lastName': { en: 'Last Name', ar: 'اسم العائلة' },
  'add.address': { en: 'Address', ar: 'العنوان' },
  'add.phone': { en: 'Phone Number', ar: 'رقم الهاتف' },
  'add.floor': { en: 'Floor Number', ar: 'رقم الطابق' },
  'add.subType': { en: 'Subscription Type', ar: 'نوع الاشتراك' },
  'add.fixedValue': { en: 'Fixed Amber Value', ar: 'قيمة أمبير الثابتة' },
  'add.discount': { en: 'Discount ($)', ar: 'الخصم ($)' },
  'add.discountHint': { en: 'Optional — deducted from final price', ar: 'اختياري — يُخصم من السعر النهائي' },
  'add.save': { en: 'Save Customer', ar: 'حفظ العميل' },
  'add.success': { en: 'Customer added successfully', ar: 'تمت إضافة العميل بنجاح' },
  'add.editTitle': { en: 'Edit Customer', ar: 'تعديل العميل' },
  'add.update': { en: 'Update Customer', ar: 'تحديث العميل' },
  'add.updateSuccess': { en: 'Customer updated successfully', ar: 'تم تحديث العميل بنجاح' },

  // Reports
  'reports.title': { en: 'Reports', ar: 'التقارير' },
  'reports.summary': { en: 'Monthly Summary', ar: 'ملخص شهري' },
  'reports.totalCollected': { en: 'Total Collected', ar: 'إجمالي المحصل' },
  'reports.expectedIncome': { en: 'Expected Income', ar: 'الدخل المتوقع' },
  'reports.unpaidBalance': { en: 'Unpaid Balance', ar: 'الرصيد غير المدفوع' },
  'reports.paidCustomers': { en: 'Paid Customers', ar: 'العملاء المدفوعين' },
  'reports.unpaidCustomers': { en: 'Unpaid Customers', ar: 'العملاء غير المدفوعين' },
  'reports.month': { en: 'Month', ar: 'الشهر' },
  'reports.collectionRate': { en: 'Collection Rate', ar: 'نسبة التحصيل' },

  // Settings
  'settings.title': { en: 'Settings', ar: 'الإعدادات' },
  'settings.language': { en: 'Language', ar: 'اللغة' },
  'settings.amberPrice': { en: 'Amper Price Per Unit', ar: 'سعر الأمبير للوحدة' },
  'settings.kwhPrice': { en: 'Price Per kWh (Counter)', ar: 'سعر الكيلوواط (عداد)' },
  'settings.userManagement': { en: 'User Management', ar: 'إدارة المستخدمين' },
  'settings.addUser': { en: 'Add User', ar: 'إضافة مستخدم' },
  'settings.removeUser': { en: 'Remove', ar: 'حذف' },
  'settings.save': { en: 'Save', ar: 'حفظ' },
  'settings.saved': { en: 'Settings saved', ar: 'تم حفظ الإعدادات' },
  'settings.english': { en: 'English', ar: 'الإنجليزية' },
  'settings.arabic': { en: 'Arabic', ar: 'العربية' },
  'settings.currency': { en: 'Currency Symbol', ar: 'رمز العملة' },
  'settings.role': { en: 'Role', ar: 'الدور' },
  'settings.admin': { en: 'Admin', ar: 'مدير' },
  'settings.employee': { en: 'Employee', ar: 'موظف' },

  // Receipt
  'receipt.title': { en: 'El Iman - Electricity Receipt', ar: 'الإيمان - إيصال كهرباء' },
  'receipt.customer': { en: 'Customer', ar: 'العميل' },
  'receipt.address': { en: 'Address', ar: 'العنوان' },
  'receipt.month': { en: 'Month', ar: 'الشهر' },
  'receipt.type': { en: 'Type', ar: 'النوع' },
  'receipt.usage': { en: 'Usage', ar: 'الاستهلاك' },
  'receipt.price': { en: 'Price', ar: 'السعر' },
  'receipt.discount': { en: 'Discount', ar: 'الخصم' },
  'receipt.finalPrice': { en: 'Final Price', ar: 'السعر النهائي' },
  'receipt.status': { en: 'Status', ar: 'الحالة' },
  'receipt.paid': { en: 'Paid', ar: 'مدفوع' },
  'receipt.unpaid': { en: 'Unpaid', ar: 'غير مدفوع' },
  'receipt.prorated': { en: 'Prorated', ar: 'محسوب نسبياً' },
  'receipt.proratedNote': { en: 'Charged for {days} of {total} days', ar: 'محسوب لـ {days} من {total} يوم' },
  'receipt.generated': { en: 'Generated on', ar: 'تم الإنشاء في' },
  'receipt.fixed': { en: 'Fixed', ar: 'ثابت' },
  'receipt.counter': { en: 'Counter (kWh)', ar: 'عداد' },
  'receipt.units': { en: 'Amper', ar: 'امبير' },
  'receipt.lastMonthUsage': { en: 'Last Month Usage', ar: 'استهلاك الشهر السابق' },
  'receipt.currentMonthUsage': { en: 'Current Month Usage', ar: 'استهلاك الشهر الحالي' },
  'receipt.currentMonthPrice': { en: 'Current Month Price', ar: 'سعر الشهر الحالي' },
  'receipt.kWh': { en: 'kWh', ar: 'كيلوواط ساعة' },
  'receipt.floor': { en: 'Floor', ar: 'الطابق' },
  'receipt.boxNumber': { en: 'Box Number', ar: 'رقم العلبة' },
  'receipt.wireNumber': { en: 'Wire Number', ar: 'رقم الشريط' },
  'receipt.contact': { en: 'Contact', ar: 'للاستفسار' },
  'customers.boxNumber': { en: 'Box #', ar: 'رقم العلبة' },
  'customers.wireNumber': { en: 'Wire #', ar: 'رقم الشريط' },

  // Receipts
  'nav.receipts': { en: 'Receipts', ar: 'الإيصالات' },
  'receipts.search': { en: 'Search by name or phone...', ar: 'بحث بالاسم أو الهاتف...' },
  'receipts.totalReceipts': { en: 'Total Receipts', ar: 'إجمالي الإيصالات' },
  'receipts.totalCollected': { en: 'Total Collected', ar: 'إجمالي المحصل' },
  'receipts.customersWithReceipts': { en: 'Customers', ar: 'العملاء' },
  'receipts.receipts': { en: 'receipts', ar: 'إيصالات' },
  'receipts.noResults': { en: 'No receipts match your search', ar: 'لا توجد إيصالات مطابقة' },
  'receipts.noReceipts': { en: 'No paid receipts yet', ar: 'لا توجد إيصالات مدفوعة بعد' },
  'receipts.amount': { en: 'Amount', ar: 'المبلغ' },
  'receipts.usage': { en: 'Usage', ar: 'الاستهلاك' },
  'receipts.discount': { en: 'Discount', ar: 'الخصم' },
  'receipts.paidAt': { en: 'Paid At', ar: 'تاريخ الدفع' },
  'receipts.loadMore': { en: 'Load more', ar: 'عرض المزيد' },
  'receipts.remaining': { en: 'remaining', ar: 'متبقي' },

  // Diesel
  'nav.diesel': { en: 'Diesel Purchases', ar: 'مشتريات الديزل' },
  'diesel.addEntry': { en: 'Add Diesel Purchase', ar: 'إضافة شراء ديزل' },
  'diesel.liters': { en: 'Liters', ar: 'لترات' },
  'diesel.litersPlaceholder': { en: 'Enter liters', ar: 'أدخل اللترات' },
  'diesel.priceUsd': { en: 'Price (USD)', ar: 'السعر (دولار)' },
  'diesel.pricePlaceholder': { en: 'Enter price', ar: 'أدخل السعر' },
  'diesel.save': { en: 'Save', ar: 'حفظ' },
  'diesel.saved': { en: 'Entry saved', ar: 'تم الحفظ' },
  'diesel.validationError': { en: 'Enter valid positive numbers', ar: 'أدخل أرقاماً صحيحة موجبة' },
  'diesel.date': { en: 'Date', ar: 'التاريخ' },
  'diesel.time': { en: 'Time', ar: 'الوقت' },
  'diesel.noEntries': { en: 'No diesel purchases yet', ar: 'لا توجد مشتريات ديزل بعد' },

  // Add customer extra fields
  'add.boxNumber': { en: 'Box Number', ar: 'رقم العلبة' },
  'add.wireNumber': { en: 'Wire Number', ar: 'رقم الشريط' },
  'add.subscriptionFee': { en: 'Subscription Fee (USD)', ar: 'رسم الاشتراك (دولار)' },
  'add.subscriptionFeeHint': { en: 'For counter-type only — added to final price', ar: 'لعملاء العداد فقط — يُضاف إلى السعر النهائي' },
  'receipt.subscriptionFee': { en: 'Subscription Fee', ar: 'رسم الاشتراك' },
  'customers.subscriptionFee': { en: 'Sub. Fee', ar: 'رسم اشتراك' },

  // Diesel extras
  'diesel.edit': { en: 'Edit', ar: 'تعديل' },
  'diesel.delete': { en: 'Delete', ar: 'حذف' },
  'diesel.updated': { en: 'Entry updated', ar: 'تم التحديث' },
  'diesel.deleted': { en: 'Entry deleted', ar: 'تم الحذف' },

  // Employees extras
  'employees.month': { en: 'Month', ar: 'الشهر' },

  // Employees
  'nav.employees': { en: 'Employees', ar: 'الموظفون' },
  'employees.title': { en: 'Employees', ar: 'الموظفون' },
  'employees.name': { en: 'Employee Name', ar: 'اسم الموظف' },
  'employees.salary': { en: 'Salary', ar: 'الراتب' },
  'employees.loan': { en: 'Loan', ar: 'السلفة' },
  'employees.deduction': { en: 'Salary Deduction', ar: 'حسم الراتب' },
  'employees.save': { en: 'Save', ar: 'حفظ' },
  'employees.saved': { en: 'Employee saved', ar: 'تم حفظ الموظف' },
  'employees.validationError': { en: 'Name and salary are required', ar: 'الاسم والراتب مطلوبان' },
  'employees.noEntries': { en: 'No employees yet', ar: 'لا يوجد موظفون بعد' },
  'employees.delete': { en: 'Delete', ar: 'حذف' },
  'employees.netSalary': { en: 'Net Salary', ar: 'صافي الراتب' },

  // Expenses
  'nav.expenses': { en: 'Expenses', ar: 'المصاريف' },
  'expenses.title': { en: 'Expenses', ar: 'المصاريف' },
  'expenses.amount': { en: 'Amount (USD)', ar: 'المبلغ (دولار)' },
  'expenses.type': { en: 'Expense Type', ar: 'نوع المصروف' },
  'expenses.month': { en: 'Month', ar: 'الشهر' },
  'expenses.save': { en: 'Save', ar: 'حفظ' },
  'expenses.saved': { en: 'Expense saved', ar: 'تم حفظ المصروف' },
  'expenses.validationError': { en: 'Amount and type are required', ar: 'المبلغ والنوع مطلوبان' },
  'expenses.noEntries': { en: 'No expenses yet', ar: 'لا توجد مصاريف بعد' },
  'expenses.date': { en: 'Date', ar: 'التاريخ' },
  'expenses.time': { en: 'Time', ar: 'الوقت' },
  'expenses.delete': { en: 'Delete', ar: 'حذف' },

  // Reports extras
  'reports.totalSalaries': { en: 'Total Salaries', ar: 'إجمالي الرواتب' },
  'reports.totalLoans': { en: 'Total Loans', ar: 'إجمالي السلف' },
  'reports.totalDeductions': { en: 'Total Deductions', ar: 'إجمالي الحسومات' },
  'reports.totalExpenses': { en: 'Total Expenses', ar: 'إجمالي المصاريف' },
  'reports.employeeSummary': { en: 'Employee Summary', ar: 'ملخص الموظفين' },
  'reports.expenseSummary': { en: 'Expense Summary', ar: 'ملخص المصاريف' },

  // Common
  'common.confirm': { en: 'Are you sure?', ar: 'هل أنت متأكد؟' },
  'common.yes': { en: 'Yes', ar: 'نعم' },
  'common.no': { en: 'No', ar: 'لا' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.accessDenied': { en: 'Access denied', ar: 'الوصول مرفوض' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('amber_language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('amber_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[key]?.[language] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
