import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import AlertNotification from "../menu/notify";
import Preloader from "../menu/buttonPreloader";

interface OrderProps {
  orders: {
    id: number,
    order_code: string,
    invoice: string,
    status: string,
    amount: number,
    created_at: string,
    customer: {
      id: number,
      name: string,
      phone: string,
      email: string,
      prefered_payment: string,
    },
    products: [{
      id: number,
      name: string,
      price: number,
      qty: number,
    }],
  }
  onClose: () => void;
}

interface Data{
  id: number;
  site_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  tin: string;
  stamp_url: string;
};

const formatNumber = (amount: number , decimal: number): string => {
  return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
  }).format(amount);
};

function formatDate(dateString: any) {
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const prefix = Number(hours) > 12 ? 'PM' : 'AM';
  return `${month}, ${day} ${year} ${hours}:${minutes}:${seconds} ${prefix}`;
};
const toBase64 = (url: string) =>
  fetch(url)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

    const generateRandomNumber = (): string => {
      let randomNumber = "";
      for (let i = 0; i < 8; i++) {
        randomNumber += Math.floor(Math.random() * 10).toString();
      }
      return randomNumber;
    };

const ViewSalesOrder = ({ orders, onClose }: OrderProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appData, setAppData] = useState<Data | null>(null); // Ensure it's always a string
  const [appName, setAppName] = useState<string>(""); // Ensure it's always a string

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/settings/get`);
        if (!response.ok) throw new Error("Failed to fetch");
        const settings  = await response.json();
        setAppData(settings); // <- extract app_name (site_name)
      } catch (error) {
        setError("An error occurred while fetching: "+error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    if (appData?.site_name) {
      setAppName(appData.site_name);
    }
  }, [appData]);

  const handleUpdate = async (saleId: number) => {
    setLoading(true);
    const response = await fetch(`/api/sales/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: saleId }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update");
      } catch {
        setError("Failed to update: Server error.");
      }
      setLoading(false);
      return;
    }

    setSuccess("Sales status updated successfully");
    setLoading(false);
  };

  const handleDownloadInvoice = async () => { 
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    const marginX = 10;
    const marginY = 10;
    const contentWidth = pageWidth - marginX * 2;
  
    const logoBase64 = await toBase64("/logo.png");
    const stamp = appData?.stamp_url ? appData.stamp_url : "/stamp/empty_stamp.png";
    const stampBase64 = await toBase64(stamp);
  
    // Outer border
    doc.setDrawColor(180); 
    doc.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);
  
    // Header background
    const headerHeight = 15;
    doc.setFillColor(190, 240, 220); 
    doc.rect(marginX, marginY, contentWidth, headerHeight, 'F');
  
    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`${appName.toLocaleUpperCase()} - INVOICE`, pageWidth / 2, marginY + 10, { align: 'center' });
  
    // Company Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const leftX = marginX + 2;
    const topY = marginY + headerHeight + 10;
    doc.text(`Company: ${appName}`, leftX, topY);
    doc.text(`Email: ${appData?.contact_email}`, leftX, topY + 5);
    doc.text(`Phone: ${appData?.contact_phone}`, leftX, topY + 10);
    doc.text(`TIN: ${appData?.tin}`, leftX, topY + 15);
    doc.text(`Address: Kigali, Rwanda`, leftX, topY + 20);
  
    // Billed To Section
    const billToY = topY + 30;
    doc.setFont('helvetica', 'bold');
    doc.text("BILLED TO:", leftX, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer: ${orders.customer?.name}`, leftX, billToY + 5);
    doc.text(`Phone: ${orders.customer?.phone}`, leftX, billToY + 10);
    if (orders.customer?.email) {
      doc.text(`Email: ${orders.customer.email}`, leftX, billToY + 15);
    }
    
    // Invoice Details
    const rightX = pageWidth - marginX - 60;
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE DETAILS", rightX, topY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${orders.invoice}`, rightX, topY + 5);
    doc.text(`Order Code: ${orders.order_code}`, rightX, topY + 10);
    doc.text(`Status: ${orders.status}`, rightX, topY + 15);
    doc.text(`Date: ${formatDate(orders.created_at)}`, rightX, topY + 20);
  
    // Products Table
    const tableStartY = billToY + 18;
    const tableData = orders.products.map((product) => [
      product.name,
      product.qty.toString(),
      `${formatNumber(product.price, 2)} RWF`,
      `${formatNumber(product.price * product.qty, 2)} RWF`,
    ]);
  
    autoTable(doc, {
      head: [["Product Name", "Qty", "Unit Price", "Total"]],
      body: tableData,
      startY: tableStartY,
      theme: 'grid',
      pageBreak: 'auto',
      headStyles: {
        fillColor: [190, 240, 220],
        textColor: 0,
        halign: 'left',
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      margin: { left: marginX, right: marginX },
    });
  
    const finalY = (doc as any).lastAutoTable.finalY;
  
    // Totals Box
    const subtotal = orders.products.reduce((sum, p) => sum + p.price * p.qty, 0);
    const taxRate = 0.18;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
  
    const totalsStartY = finalY + 10;
    if (totalsStartY + 60 > pageHeight - marginY) {
      doc.addPage();
      doc.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);
    }
  
    const totalsBoxX = pageWidth - marginX - 70;
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.rect(totalsBoxX, totalsStartY, 70, 25, 'FD');
  
    let textY = totalsStartY + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sub total: ${formatNumber(subtotal, 2)} RWF`, totalsBoxX + 5, textY);
    doc.text(`Tax (${taxRate * 100}%): ${formatNumber(tax, 2)} RWF`, totalsBoxX + 5, textY + 7);
  
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatNumber(total, 2)} RWF`, totalsBoxX + 5, textY + 15);
  
    // QR Code
    const qrText = `Invoice No: ${orders.invoice}\nOrder Code: ${orders.order_code}\nCustomer: ${orders.customer.name}\nAmount: ${orders.amount} RWF\nhttps://ksm.kamero.rw/sales/invoice?id=${orders.invoice}&mode=viewonly`;
    const qrDataUrl = await QRCode.toDataURL(qrText);
    doc.addImage(qrDataUrl, "PNG", leftX, textY - 10, 40, 40);
  
    // Notes
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text("Thank you for doing business with us!", leftX + 2, textY + 35);
    
    doc.addImage(stampBase64, "PNG", pageWidth - 120, totalsStartY + 35, 70, 30, undefined, undefined, 40);

    // Logo bottom-right 
    doc.setFontSize(9);
    doc.text("Powered by ", pageWidth - 58, totalsStartY + 40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text("KAMERO \nSTOCK \nMANAGEMENT", pageWidth - 58, totalsStartY + 45);
    doc.addImage(logoBase64, "PNG", pageWidth - 32, totalsStartY + 35, 20, 20);
    
    // 📄✨ Instead of download, open in new window and print
     const pdfBlob = doc.output('blob');
     const pdfUrl = URL.createObjectURL(pdfBlob);
     const printWindow = window.open(pdfUrl);
 
     if (printWindow) {
       printWindow.addEventListener('load', () => {
         printWindow.focus();
         printWindow.print();
       });
     }
    // Save
    doc.save(`INVOICE-${orders.order_code}-${orders.invoice}-${Date.now()}.pdf`);
  };
  


  const handleDownloadProformaInvoice = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    const marginX = 10;
    const marginY = 10;
    const contentWidth = pageWidth - marginX * 2;
  
    const createdAtDate = new Date(orders.created_at);
    const dueDate = new Date(createdAtDate);
    dueDate.setDate(dueDate.getDate() + 7);
  
    const logoBase64 = await toBase64("/logo.png");
  
    //Convert stamp to base64
    const stamp = appData?.stamp_url ? appData.stamp_url : "/stamp/empty_stamp.png";
    const stampBase64 = await toBase64(stamp);

    // Outer border
    doc.setDrawColor(180); // soft grey border
    doc.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);
  
    // Header background inside margin
    const headerHeight = 20;
    doc.setFillColor(190, 240, 220); // light blue
    doc.rect(marginX, marginY, contentWidth, headerHeight, 'F');
  
    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text("PROFORMA INVOICE", pageWidth / 2, marginY + 12, { align: 'center' });
  
    // Company Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const leftX = marginX + 2;
    const topY = marginY + headerHeight + 10;
    doc.text(`Company Name: ${appName}`, leftX, topY);
    doc.text(`Email: ${appData?.contact_email}`, leftX, topY + 6);
    doc.text(`Phone: ${appData?.contact_phone}`, leftX, topY + 12);
    doc.text(`TIN: ${appData?.tin}`, leftX, topY + 18);
    doc.text("Address: Kigali, Rwanda", leftX, topY + 24);
  
    // BILLED TO Section
    const billToY = topY + 35;
    doc.setFont('helvetica', 'bold');
    doc.text("BILLED TO:", leftX, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${orders.customer.name}`, leftX, billToY + 6);
    doc.text(`Phone: ${orders.customer.phone}`, leftX, billToY + 12);
    doc.text(`Email: ${orders.customer.email || "N/A"}`, leftX, billToY + 18);
  
    // Invoice Details
    const rightX = pageWidth - marginX - 70;
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE DETAILS", rightX, topY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${orders.invoice}`, rightX, topY + 6);
    doc.text(`Order Code: ${orders.order_code}`, rightX, topY + 12);
    doc.text(`Date: ${formatDate(orders.created_at)}`, rightX, topY + 18);
    doc.text(`Due: ${formatDate(dueDate)}`, rightX, topY + 24);
  
    // Products Table
    const tableStartY = billToY + 25;
    const tableData = orders.products.map((product) => [
      product.name,
      product.qty.toString(),
      `${formatNumber(product.price, 2)} RWF`,
      `${formatNumber(product.price * product.qty, 2)} RWF`
    ]);
  
    autoTable(doc, {
      head: [["Product name", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      startY: tableStartY,
      theme: 'grid',
      pageBreak: 'auto',
      headStyles: {
        fillColor: [190, 240, 220],
        textColor: 0,
        halign: 'left'
      },
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      margin: { left: marginX, right: marginX }
    });
  
    const finalY = (doc as any).lastAutoTable.finalY;
  
    // Totals Box
    const subtotal = orders.products.reduce((sum, p) => sum + p.price * p.qty, 0);
    const taxRate = 0.18;
    const tax = subtotal * taxRate;
    const total = subtotal +  tax;
  
    const totalsStartY = finalY + 10;
    if (totalsStartY + 60 > pageHeight - marginY) {
      doc.addPage();
      doc.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);
    } 
  
    const totalsBoxX = pageWidth - marginX - 70;
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.rect(totalsBoxX, totalsStartY, 70, 25, 'FD');
  
    let textY = totalsStartY + 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sub total: ${formatNumber(subtotal, 2)} RWF`, totalsBoxX + 5, textY);
    doc.text(`Tax (${taxRate * 100}%): ${formatNumber(tax, 2)} RWF`, totalsBoxX + 5, textY + 7);
  
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatNumber(total, 2)} RWF`, totalsBoxX + 5, textY + 15);
    
    // Notes
    doc.setFontSize(9);  
    doc.setFont('helvetica', 'light');
    doc.text("Payment is due within the following number of days: 7", marginX + 2, totalsStartY + 27);
    doc.text("THANKS FOR DOING BUSINESS WITH US. VISIT US AGAIN!!!", marginX + 2, totalsStartY + 35);

    doc.addImage(stampBase64, "PNG", pageWidth - 120, totalsStartY + 35, 70, 30, undefined, undefined, 40);
  
    // Logo bottom-right 
    doc.text("Powered by ", pageWidth - 58, totalsStartY + 40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text("KAMERO \nSTOCK \nMANAGEMENT", pageWidth - 58, totalsStartY + 45);
    doc.addImage(logoBase64, "PNG", pageWidth - 32, totalsStartY + 35, 20, 20);
   
    // 📄✨ Instead of download, open in new window and print
   const pdfBlob = doc.output('blob');
   const pdfUrl = URL.createObjectURL(pdfBlob);
   const printWindow = window.open(pdfUrl);

   if (printWindow) {
     printWindow.addEventListener('load', () => {
       printWindow.focus();
       printWindow.print();
     });
   }
    // Save PDF
    doc.save(`PROFORMA-INVOICE-${orders.invoice}-${Date.now()}.pdf`);
  };
  
 const handleDownloadReceipt = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    const marginX = 10;
    const marginY = 10;
    const contentWidth = pageWidth - marginX * 2;
  
    const stamp = appData?.stamp_url ? appData.stamp_url : "/stamp/empty_stamp.png";
    const stampBase64 = await toBase64(stamp);
    const logoBase64 = await toBase64("/logo.png");
  
    // Outer Border
    doc.setDrawColor(180);
    doc.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);
  
    // Header
    doc.setFillColor(255, 230, 200);
    doc.rect(marginX, marginY, contentWidth, 18, 'F');
  
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("PAYMENT RECEIPT", pageWidth / 2, marginY + 12, { align: 'center' });
    
    // Invoice Details
    const rightX = pageWidth - marginX - 70;
    const billToY = marginY + 28;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(new Date())}`, rightX, billToY);
    doc.text(`Reciept No: ${generateRandomNumber()}`, rightX, billToY + 5);
    
    // Company Section
    const leftX = marginX + 5;
    let currentY = marginY + 40;
  
    const lineHeight = 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text("FROM:", leftX, currentY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    currentY += lineHeight + 2;
    doc.text(`Company: ${appData?.site_name}`, leftX, currentY);
  
    currentY += lineHeight;
    doc.text(`Phone: ${appData?.contact_phone}`, leftX, currentY);
  
    currentY += lineHeight;
    doc.text(`Email: ${appData?.contact_email}`, leftX, currentY);
  
    currentY += lineHeight;
    doc.text(`TIN: ${appData?.tin}`, leftX, currentY);

    currentY += lineHeight;
    doc.text(`Address: ${appData?.address || "Kigali, Rwanda"}`, leftX, currentY);
  
    


    // Add some spacing after BILLED TO section
    currentY = marginY + 35;

    currentY += lineHeight + 2;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text("BILLED TO:", rightX, currentY);

    currentY += 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
   
    currentY += 5;
    doc.text(`Name: ${orders.customer?.name}`, rightX, currentY);
  
    currentY += lineHeight;
    doc.text(`Phone: ${orders.customer?.phone}`, rightX, currentY);
  
    currentY += lineHeight;
    doc.text(`Payment: ${orders.customer?.prefered_payment || "Mobile Money"}`, rightX, currentY);
  
    currentY += lineHeight;
    doc.text(`Email: ${orders.customer?.email || "N/A"}`, rightX, currentY);
  
    currentY += 10;
    // Now start the Product Table safely BELOW the Email line
    const tableData = orders.products.map((product) => [
      product.name,
      product.qty.toString(),
      `${formatNumber(Number(product.price), 2)} RWF`,
      `${formatNumber(Number(product.price) * Number(product.qty), 2)} RWF`
    ]);
  
    autoTable(doc, {
      head: [["Product Name", "Qty", "Unit Price", "Amount"]],
      body: tableData,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [255, 230, 200], textColor: 0, halign: 'center' },
      styles: { fontSize: 10, cellPadding: 2, halign: 'center' },
      margin: { left: marginX, right: marginX }
    });
  
    const finalY = (doc as any).lastAutoTable.finalY;
  
    // Totals Section
    const subtotal = orders.products.reduce((sum, p) => sum + Number(p.price) * Number(p.qty), 0);
    let totalsStartY = finalY + 10;
  
    doc.setFontSize(12);
    doc.setTextColor(0);
  
    doc.text(`Sub Total: ${formatNumber(subtotal, 2)} RWF`, leftX, totalsStartY);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL PAID: ${formatNumber(subtotal, 2)} RWF`, leftX, totalsStartY + 8);
    // Stamp (left bottom)
    doc.addImage(stampBase64, "PNG", pageWidth - 130, totalsStartY + 10, 68, 30, undefined, undefined, 20);
  
    // Logo and Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    // Logo bottom-right 
    doc.text("Powered by ", pageWidth - 63, totalsStartY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text("KAMERO \nSTOCK \nMANAGEMENT", pageWidth - 63, totalsStartY + 15);
    doc.addImage(logoBase64, "PNG", pageWidth - 38, totalsStartY + 5, 20, 20);
     
    // 📄✨ Instead of download, open in new window and print
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);

    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.focus();
        printWindow.print();
      });
    }
    doc.save(`RECEIPT-${Date.now()}.pdf`);
  };
  
  

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-xs z-30">
      {error && <AlertNotification message={error} type="error" />}
      {success && <AlertNotification message={success} type="success" />}
      <div className="bg-neutral-900 p-5 rounded-xl w-[40vw] max-w-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">View Sale Details</h4>
          <button
            onClick={onClose}
            className="flex justify-self-end items-center space-x-1 border bg-gray-800 border-gray-600 px-2 py-1 text-gray-400 cursor-pointer text-sm rounded-md"
          >
            <i className="bi bi-x-circle mr-1"></i> Close
          </button>
        </div>

        {/* Order Details */}
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info-circle text-emerald-700 mr-1" />
          Sales details listed below. Review before confirmation.
          <ul className="mt-2 p-1 text-neutral-500 text-sm space-y-2 border-emerald-900">
            <li className="text-xl text-emerald-800"><strong>{orders.order_code} - {orders.customer.name}</strong></li>
            <li><strong>Sale Code:</strong> {orders.order_code}</li>
            <li><strong>Invoice:</strong> {orders.invoice}</li>
            <li><strong>Customer Name:</strong> {orders.customer.name}</li>
            <li><strong>Customer Phone:</strong> {orders.customer.phone}</li>
            <li><strong>Prefered Payment:</strong> {orders.customer.prefered_payment}</li>
            <li><strong>Total Price:</strong> {formatNumber(orders.amount, 2)} RWF</li>
            <li><strong>Date:</strong> {formatDate(orders.created_at)}</li>
          </ul>
        </div>

        {/* Products Table */}
        <div className="border border-neutral-700 rounded-md max-h-[35vh] overflow-hidden overflow-y-visible mt-2">
          <table className="w-full text-sm text-left text-neutral-400">
            <thead className="bg-neutral-800 text-neutral-500">
              <tr>
                <th className="py-2 px-4">Product</th>
                <th className="py-2 px-4">Quantity</th>
                <th className="py-2 px-4">Price</th>
                <th className="py-2 px-4">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.products.map((order, index) => (
                <tr key={order.id} className={index % 2 === 0 ? "bg-neutral-850" : ""}>
                  <td className="py-2 px-4">{order.name}</td>
                  <td className="py-2 px-4">{formatNumber(order.qty, 0)}</td>
                  <td className="py-2 px-4">{formatNumber(order.price, 2)} RWF</td>
                  <td className="py-2 px-4">{formatNumber(order.price * order.qty, 2)} RWF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Buttons */}
        <div className="relative w-full flex items-center pt-4 space-x-2 gap-2 flex-wrap">
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center space-x-1 border bg-orange-900 border-range-600 px-2 py-1 text-white cursor-pointer text-sm rounded-md"
          >
            <i className="bi bi-printer mr-1"></i> Print Invoice
          </button>
          <button
            onClick={handleDownloadProformaInvoice}
            className="flex items-center space-x-1 border bg-sky-800 border-sky-600 px-2 py-1 text-white cursor-pointer text-sm rounded-md"
          >
            <i className="bi bi-printer mr-1"></i> Print Proforma
          </button>
          <button
            onClick={handleDownloadReceipt}
            className="flex items-center space-x-1 border bg-gray-800 border-gray-600 px-2 py-1 text-white cursor-pointer text-sm rounded-md"
          >
            <i className="bi bi-printer mr-1"></i> Print Reciept
          </button>
          {orders.status === "Pending" && (
            <button
              onClick={() => handleUpdate(orders.id)}
              className="flex items-center space-x-1 border bg-emerald-800 border-emerald-600 px-2 py-1 text-white cursor-pointer text-sm rounded-md"
            >
              {loading && <Preloader />} <i className="bi bi-check-circle mr-1"></i> Mark Complete
            </button>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default ViewSalesOrder;
