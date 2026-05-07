/**
 * Sample CSV data generators for testing SoD detection
 * Use these formats to understand what AGR_USERS and AGR_1251 CSVs should look like
 */
export function generateSampleAgrUsersCSV() {
    const headers = ['uname', 'user_full_name', 'user_type', 'locked_status'];
    const data = [
        ['FINANCE_MGR', 'John Smith', 'Dialog', 'Unlocked'],
        ['PROC_LEAD', 'Sarah Johnson', 'Dialog', 'Unlocked'],
        ['SALES_OPS', 'Michael Chen', 'Dialog', 'Unlocked'],
        ['FI_ANALYST', 'Emma Wilson', 'Dialog', 'Unlocked'],
        ['MM_USER', 'David Kumar', 'Dialog', 'Unlocked'],
        ['VENDOR_MGR', 'Lisa Anderson', 'Dialog', 'Unlocked'],
        ['AP_CLERK', 'James Brown', 'Dialog', 'Unlocked'],
        ['DEVELOPER', 'Rachel Garcia', 'Dialog', 'Unlocked'],
        ['TEST_USER', 'Kevin White', 'Dialog', 'Locked'],
        ['ADMIN_SAP', 'Patricia Lee', 'Dialog', 'Unlocked'],
    ];
    return [headers, ...data]
        .map(row => row.map(col => `"${col}"`).join(','))
        .join('\n');
}
export function generateSampleAgr1251CSV() {
    const headers = ['role_name', 'tcode', 'tcode_description', 'auth_object'];
    const data = [
        // Finance roles - intentionally create conflicts
        ['ZFINANCE_BP', 'FB60', 'Enter Incoming Invoices', 'F_BKPF_FI'],
        ['ZFINANCE_BP', 'F110', 'Outgoing Payments - Post', 'F_BKPF_FI'],
        ['ZFINANCE_ANALYST', 'FB70', 'Enter Customer Invoices', 'F_BKPF_FI'],
        ['ZFINANCE_ANALYST', 'F110', 'Outgoing Payments - Post', 'F_BKPF_FI'],
        ['ZFINANCE_MGMT', 'FK01', 'Maintain Vendors (General Section)', 'F_EKKO_EKK'],
        ['ZFINANCE_MGMT', 'F110', 'Outgoing Payments - Post', 'F_BKPF_FI'],
        ['ZFINANCE_MGMT', 'FD01', 'Maintain Customers (General Sec.)', 'F_VKORG_VKO'],
        // Procurement roles
        ['ZMATERIALS_MANAGER', 'ME21N', 'Create Purchase Order', 'F_EKKO_EKK'],
        ['ZMATERIALS_MANAGER', 'MIRO', 'Enter Incoming Invoice', 'F_MIRO_INV'],
        ['ZPROCURE_USER', 'ME21N', 'Create Purchase Order', 'F_EKKO_EKK'],
        ['ZPROCURE_USER', 'ME29N', 'Release Purchase Order', 'F_EKKO_EKK'],
        ['ZPROCURE_GOODS', 'MIGO', 'Goods Movement', 'F_MIGO_MOV'],
        ['ZPROCURE_GOODS', 'MIRO', 'Enter Incoming Invoice', 'F_MIRO_INV'],
        // Sales roles
        ['ZSALES_EXEC', 'VA01', 'Create Sales Order', 'F_VBAK_VBA'],
        ['ZSALES_EXEC', 'VF01', 'Create Billing Document', 'F_VBRK_VBR'],
        ['ZSALES_REP', 'VA01', 'Create Sales Order', 'F_VBAK_VBA'],
        ['ZSALES_REP', 'VF02', 'Change Billing Document', 'F_VBRK_VBR'],
        // Additional tcodes
        ['ZFINANCE_BP', 'FB03', 'Display Document', 'F_BKPF_FI'],
        ['ZMATERIALS_MANAGER', 'MBST', 'Stock Overview', 'F_MARD_MAR'],
        ['ZSALES_EXEC', 'VA03', 'Display Sales Order', 'F_VBAK_VBA'],
    ];
    return [headers, ...data]
        .map(row => row.map(col => `"${col}"`).join(','))
        .join('\n');
}
export function downloadSampleCSV(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
