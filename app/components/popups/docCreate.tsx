import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import AlertNotification from "../menu/notify";

interface AddProps {
  onClose: () => void;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  prefered_payment: string;
}

interface Item {
  id: number;
  name: string;
  stock: number;
}

interface Product {
  id: number;
  price: number;
  qty: number;
}

interface FormData {
  status: string;
  customer: string;
  products: Product[];
}

interface Data {
  id: number;
  site_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  tin: string;
  stamp_url: string;
}

const formatNumber = (amount: number, decimal: number): string => {
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
}

const generateRandomNumber = (): string => {
  let randomNumber = "";
  for (let i = 0; i < 8; i++) {
    randomNumber += Math.floor(Math.random() * 10).toString();
  }
  return randomNumber;
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

const CreateDoc = ({ onClose }: AddProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [formData, setFormData] = useState<FormData>({
    status: "",
    customer: "",
    products: [],
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [products, setProducts] = useState<{ id: number; name: string; price: string; amount: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [item, setItem] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [appData, setAppData] = useState<Data | null>(null);
  const [appName, setAppName] = useState<string>("");

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/settings/get`);
        if (!response.ok) throw new Error("Failed to fetch");
        const settings = await response.json();
        setAppData(settings);
      } catch (error) {
        setError("An error occurred while fetching: " + error);
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

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomer(null);
    setFilteredCustomers(
      customers.filter(cat =>
        cat.name.toLowerCase().includes(value.toLowerCase()) ||
        cat.phone.includes(value)
      )
    );
    setShowDropdown(value.length > 0);
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItem(value);
    setFilteredItems(items.filter(cat => cat.name.toLowerCase().includes(value.toLowerCase())));
    setShowDrop(value.length > 0);
  };

  const selectCustomer = (v: Customer) => {
    setCustomer(v);
    setShowDropdown(false);
  };

  const handleAddProduct = (id: number, p: string, price: string, qty: string, cstock: number) => {
    if (p.trim() && qty.trim() && price.trim()) {
      if (cstock > 0 && Number(qty) <= cstock) {
        if (!products.some(product => product.id === id)) {
          const updatedProducts = [...products, { id, name: p, price, amount: qty }];
          setProducts(updatedProducts);
          setFormData({ ...formData, products: updatedProducts.map(prod => ({ id: prod.id, price: parseInt(prod.price), qty: parseInt(prod.amount) })) });
          setItem("");
          setPrice("");
          setAmount("");
          setError(null);
        } else {
          setError("Item is already added!");
        }
      } else {
        setError("Product is low in stock, please purchase more");
      }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/get`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setItems(data);
        setLoading(false);
      } catch {
        setLoading(false);
        setError("An error occurred while fetching products.");
      }
    };

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/customers/get`);
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        setCustomers(data);
        setLoading(false);
      } catch {
        setLoading(false);
        setError("An error occurred while fetching customers.");
      }
    };

    fetchCustomers();
    fetchProducts();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handleRemoveProduct = (id: number) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    setFormData({ ...formData, products: updatedProducts.map(prod => ({ id: prod.id, price: parseInt(prod.price), qty: parseInt(prod.amount) })) });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    doc.text(`Name: ${customer?.name}`, rightX, currentY);
  
    currentY += lineHeight;
    doc.text(`Phone: ${customer?.phone}`, rightX, currentY);
  
    currentY += lineHeight;
    doc.text(`Payment: ${customer?.prefered_payment || "Mobile Money"}`, rightX, currentY);
  
    currentY += lineHeight;
    doc.text(`Email: ${customer?.email || "N/A"}`, rightX, currentY);
  
    currentY += 10;
    // Now start the Product Table safely BELOW the Email line
    const tableData = products.map((product) => [
      product.name,
      product.amount.toString(),
      `${formatNumber(Number(product.price), 2)} RWF`,
      `${formatNumber(Number(product.price) * Number(product.amount), 2)} RWF`
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
    const subtotal = products.reduce((sum, p) => sum + Number(p.price) * Number(p.amount), 0);
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
    doc.text(`Customer: ${customer?.name}`, leftX, billToY + 5);
    doc.text(`Phone: ${customer?.phone}`, leftX, billToY + 10);
    if (customer?.email) {
      doc.text(`Email: ${customer.email}`, leftX, billToY + 15);
    }
    
    // Invoice Details
    const rightX = pageWidth - marginX - 60;
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE DETAILS", rightX, topY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${generateRandomNumber()}`, rightX, topY + 5);
    doc.text(`Status: ${formData.status}`, rightX, topY + 10);
    doc.text(`Date: ${formatDate(new Date())}`, rightX, topY + 15);
  
    // Products Table
    const tableStartY = billToY + 18;
    const tableData = products.map((product) => [
      product.name,
      product.amount.toString(),
      `${formatNumber(Number(product.price), 2)} RWF`,
      `${formatNumber(Number(product.price) * Number(product.amount), 2)} RWF`,
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
    const subtotal = products.reduce((sum, p) => sum + Number(p.price) * Number(p.amount), 0);
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
    const qrText = `Invoice No: ${generateRandomNumber()}\nCustomer: ${customer?.name}\nAmount: ${total} RWF\nhttps://ksm.kamero.rw/sales/invoice?id=${generateRandomNumber()}&mode=viewonly`;
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
    doc.save(`INVOICE-${generateRandomNumber()}-${Date.now()}.pdf`);
  };


  const handleDownloadProformaInvoice = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    const marginX = 10;
    const marginY = 10;
    const contentWidth = pageWidth - marginX * 2;
  
    const createdAtDate = new Date();
    const dueDate = new Date(createdAtDate);
    dueDate.setDate(dueDate.getDate() + 7);
  
    const logoBase64 = await toBase64("/logo.png");
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
    doc.text(`Company: ${appName}`, leftX, topY);
    doc.text(`Email: ${appData?.contact_email}`, leftX, topY + 5);
    doc.text(`Phone: ${appData?.contact_phone}`, leftX, topY + 10);
    doc.text(`TIN: ${appData?.tin}`, leftX, topY + 15);
    doc.text("Address: Kigali, Rwanda", leftX, topY + 20);
  
    // BILLED TO Section
    const billToY = topY + 35;
    doc.setFont('helvetica', 'bold');
    doc.text("BILLED TO:", leftX, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer: ${customer?.name}`, leftX, billToY + 5);
    doc.text(`Phone: ${customer?.phone}`, leftX, billToY + 10);
    doc.text(`Email: ${customer?.email}`, leftX, billToY + 15);

    // Invoice Details
    const rightX = pageWidth - marginX - 70;
    doc.setFont('helvetica', 'bold');
    doc.text("INVOICE DETAILS", rightX, topY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(new Date())}`, rightX, topY + 5);
    doc.text(`Due: ${formatDate(dueDate)}`, rightX, topY + 10);
  
    // Products Table
    const tableStartY = billToY + 25;
    const tableData = products.map((product) => [
      product.name,
      product.amount.toString(),
      `${formatNumber(Number(product.price), 2)} RWF`,
      `${formatNumber(Number(product.price) * Number(product.amount), 2)} RWF`
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
    const subtotal = products.reduce((sum, p) => sum + Number(p.price) * Number(p.amount), 0);
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
    doc.save(`PROFORMA-INVOICE-${Date.now()}.pdf`);
  };

    const handleDelivery = async () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
    
      const marginX = 10;
      const marginY = 10;
      const contentWidth = pageWidth - marginX * 2;
    
      //Convert stamp to base64
      const stamp = appData?.stamp_url ? appData.stamp_url : "/stamp/empty_stamp.png";
    const stampBase64 = await toBase64(stamp);
  
      const createdAtDate = new Date();
      const dueDate = new Date(createdAtDate);
      dueDate.setDate(dueDate.getDate() + 7);
    
      const logoBase64 = await toBase64("/logo.png");
    
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
      doc.text("DELIVERY ANOTE", pageWidth / 2, marginY + 12, { align: 'center' });
    
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

      const rightX = pageWidth - marginX - 60;
      doc.text(`Date: ${formatDate(new Date())}`, rightX, topY);
      // BILLED TO Section
      const billToY = topY + 10;
  
      // Products Table
      const tableStartY = billToY + 20;
      const tableData = products.map((product) => [
        product.name,
        product.amount.toString(),
      ]);
    
      autoTable(doc, {
        head: [["Product name", "Qty"]],
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
      const total = products.reduce((sum, p) => sum + Number(p.amount), 0);
  
      const totalsStartY = finalY + 10;
      if (totalsStartY + 60 > pageHeight - marginY) {
        doc.addPage();
        doc.rect(marginX, marginY, contentWidth, pageHeight - marginY * 2);
      }
    
      const totalsBoxX = pageWidth - marginX - 70;
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.rect(totalsBoxX, totalsStartY, 65, 15, 'FD');
    
      let textY = totalsStartY + 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Items: ${formatNumber(products.length, 0)}`, totalsBoxX + 5, textY);
      doc.text(`Total Count: ${formatNumber(total, 0)}`, totalsBoxX + 5, textY + 5);
      // Notes
      doc.setFontSize(9);
      doc.setFont('helvetica', 'light');
      doc.text("Items must be delivered before 24 hours", marginX + 2, totalsStartY + 20);
     
      // Stamp (left bottom)
      doc.addImage(stampBase64, "PNG", pageWidth - 140, totalsStartY + 30, 68, 30, undefined, undefined, 20);
  
      // Logo bottom-right
      doc.text("Powered by ", pageWidth - 58, totalsStartY + 32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      doc.text("KAMERO \nSTOCK \nMANAGEMENT", pageWidth - 58, totalsStartY + 37);
      doc.addImage(logoBase64, "PNG", pageWidth - 32, totalsStartY + 27, 20, 20);
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
      doc.save(`DELIVERY-NOTE-${Date.now()}.pdf`);
    };

    const handlePrintDownload = (action: string) => {
      if(formData.products.length > 0){
        if(action === "receipt"){
          customer ? handleDownloadReceipt() : setError("Please customer information is missing"); 
        } else if(action === "proforma"){
          customer ? handleDownloadProformaInvoice() : setError("Please customer information is missing"); 
        } else if(action === "invoice"){
          customer && formData.status !== "" ? handleDownloadInvoice() : setError("Status or customer data are required"); 
        } else if (action === "delivery") {
           handleDelivery();
        } else {
          setError("Invalid request");
        }
      } else {
        setError("Product list is required, add atleast one product");
      }
    }
  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center backdrop-brightness-50 backdrop-blur-sm z-30">
      {error && (<AlertNotification message={error} type="error"/>)}
      {success && (<AlertNotification message={success} type="success"/>)}
      <div className="bg-neutral-900 p-5 rounded-xl w-[35vw]">
        <div className="flex items-center justify-between">
          <h4 className="text-neutral-400 font-semibold">Create document 🙈</h4>
          <i className="bi bi-x text-xl cursor-pointer text-neutral-500 rounded py-[2px] px-2" onClick={onClose}></i>
        </div>
        <div className="text-neutral-600 text-sm my-2">
          <i className="bi bi-info text-emerald-700"></i>
          To create purchase note, invoice, proforma and reciept just tap create after filling the fields
        </div>
      
        <form className="py-3 space-y-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Customer"
              value={customer?.name || ""}
              onChange={handleCustomerChange}
              onClick={() => setShowDropdown(true)}
              className={`${loading ? 'preloadder' : 'bg-neutral-950'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
              required
            />
            {showDropdown && (
              <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c, index) => (
                    <li key={index} className="px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => selectCustomer(c)}>
                      {c.name} ({c.phone})
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
          </div>

          <div className="max-h-[20vh] w-full flex flex-wrap items-center">
            {products.length > 0 && (
              products.map((product, index) => (
                <div key={index} className="flex items-center space-x-2 w-max rounded-md m-[2px] bg-neutral-800 border border-neutral-800 px-2 py-1">
                  <div className="flex items-center space-x-2 justify-between  text-sm text-neutral-500 ">
                    <span>{product.name} </span>
                    <span className="text-emerald-700">{product.amount} x <span className="text-orange-700">{product.price} RWF</span></span>

                  </div>
                  <i 
                    className="bi bi-dash-circle rounded-md cursor-pointer text-orange-500"
                    onClick={() => handleRemoveProduct(product.id)}
                  ></i>
                </div>
              )))}
          </div>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Product eg. Light bulb 5w" 
              value={item}
              onChange={handleItemChange}
              onClick={() => setShowDrop(true)}
              className={`${loading ? 'preloadder': 'bg-neutral-950'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
            />
            {showDrop && (
              <ul className="absolute bg-neutral-900 border border-neutral-800 rounded-md mt-1 w-full z-10 max-h-40 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((itm, index) => (
                    <li key={index} className="flex items-center justify-between px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-700" onClick={() => handleAddProduct(itm.id, itm.name, price, amount, itm.stock)}>
                      <span>{itm.name+ " ("+itm.stock+")"}</span>
                      <input type="number" placeholder="Unit price" value={price} className="bg-neutral-950 w-[8vw] rounded-md outline-0 border border-neutral-700 py-1 px-2 text-neutral-500 focus:border-emerald-700" onChange={handlePriceChange} />
                      <input type="number" placeholder="Qty" value={amount} className="bg-neutral-950 w-[5vw] rounded-md outline-0 border border-neutral-700 py-1 px-2 text-neutral-500 focus:border-emerald-700" onChange={handleAmountChange} />
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-neutral-500">No matches found</li>
                )}
              </ul>
            )}
          </div>
          <div className="w-full relative">
            <select 
             name="status" 
             id=""
             onChange={(e) => handleInputChange(e)}
             className={`${loading ? 'preloadder': 'bg-neutral-950'} rounded-md outline-0 border border-neutral-700 py-2 px-4 text-neutral-500 w-full focus:border-emerald-700`}
             required
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="relative w-full grid grid-cols-2 gap-2 items-center">
            <button type="button" onClick={() => handlePrintDownload("receipt")} className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              <i className="bi bi-printer"></i> Print Reciept
            </button>
            <button type="button" onClick={() => handlePrintDownload("invoice")} className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              <i className="bi bi-printer"></i> Print Invoice
            </button>
            <button type="button" onClick={() => handlePrintDownload("proforma")} className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              <i className="bi bi-printer"></i> Print Proforma
            </button>
            <button type="button" onClick={() => handlePrintDownload("delivery")} className="border bg-emerald-900 border-emerald-700 px-2 py-1 text-emerald-400 cursor-pointer text-sm rounded-md">
              <i className="bi bi-printer"></i> Print Delivery Anote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDoc;