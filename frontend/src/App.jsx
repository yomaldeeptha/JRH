import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  FileText,
  DollarSign,
  Plus,
  Search,
  Printer,
  Trash2,
  Edit3,
  Calendar,
  Users,
  X,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Download,
  Eye,
  FileCheck,
  Send,
  CheckCircle2,
  Utensils,
  Package,
  RefreshCw,
  Sliders,
  Check,
  Coffee,
  Wine
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

const WELCOME_DRINK_OPTIONS = ["පිළිගැනීමේ බීම (Welcome Drink)"];

const BUFFET_OPTIONS = [
  "සුදු බත් (White Rice)",
  "එළවළු බත් (Vegetable Rice)",
  "නූඩ්ල්ස් (Noodles)",
  "පැස්ටා (Pasta)",
  "කුකුළු මස් (Chicken)",
  "මාළු (Fish)",
  "ඉස්සන් (Prawns)",
  "පරිප්පු (Dhal)",
  "අල (Potato)",
  "කජු (Cashew)",
  "බටු මෝජු (Brinjal Moju)",
  "අච්චාරු (Pickle)",
  "කට්ලට් (Cutlet)",
  "පපඩම් (Papadum)",
  "සලාද (Salad)"
];

const DESSERT_OPTIONS = [
  "වටලප්පන් (Watalappam)",
  "පළතුරු (Fruits)",
  "අයිස් ක්‍රීම් (Ice Cream)",
  "ජෙලි (Jelly)",
  "අයිස් කෝපි (Ice Coffee)"
];

const ALL_BUFFET_OPTIONS = [
  ...WELCOME_DRINK_OPTIONS,
  ...BUFFET_OPTIONS
];


const PACKAGE_OPTIONS = [
  "Sette Back (සෙටිබැක්)",
  "Oil Lamp (පොල්තෙල් පහන)",
  "Table Decoration (මේස සැරසිලි)",
  "Head Table Decoration (ප්‍රධාන මේස සැරසිලි)",
  "Entrance Decoration (පිවිසුම් සැරසිලි)",
  "Cake Structure (කේක් ව්‍යුහය)",
  "Dj (ඩීජේ සංගීතය)",
  "Kandyan Dancing Group (උඩරට නැටුම්)",
  "Punjab Dhol (පන්ජාබ් ඩෝල්)",
  "Jayamangala Gatha (ජයමංගල ගාථා)",
  "Ashtaka (අෂ්ටක)",
  "Poruwa (පෝරුව)",
  "Soft Drink (සොෆ්ට් ඩ්‍රින්ක්ස් සේවා)"
];

const DEFAULT_LINE_ITEM = {
  description:
    "Buffet Menu,05 Bites\n(Chicken,Sausage,cutlet,kadala,kalawam murukku),Sette Back,Oil Lamp,Table Decoration,Head Table Decoration,Entrance Decoration,Cake Structure,Dj,Kandyan Dancing Group,Jayamangala Gatha",
  quantity: 100,
  unitPrice: 3400
};

// Check if an item cannot have decimal quantities (e.g. Serve Boys, Kitchen Helpers, staff, persons, pieces)
// These items must ALWAYS round up (Math.ceil) to full integer quantity
const isStaffOrDiscreteItem = (item) => {
  if (!item) return false;
  const mult = (item.MultiplierType || item.multiplierType || "").toLowerCase();
  const unit = (item.Unit || item.unit || "").toLowerCase();
  const name = (item.ItemName || item.itemName || "").toLowerCase();

  if (mult === "staff_200") return true;
  if (
    unit.includes("person") ||
    unit.includes("boy") ||
    unit.includes("helper") ||
    unit.includes("staff") ||
    unit.includes("nos") ||
    unit.includes("pcs") ||
    unit.includes("piece")
  ) {
    return true;
  }
  if (
    name.includes("serve boy") ||
    name.includes("kitchen helper") ||
    name.includes("helper") ||
    name.includes("boy") ||
    name.includes("waiter") ||
    name.includes("cutlet") ||
    name.includes("උපස්ථායක") ||
    name.includes("සහායක")
  ) {
    return true;
  }
  return false;
};

// Function to identify internal staff & operations costs which should NEVER appear on customer quotations
const isStaffOrOperationItemName = (name) => {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes("serve boy") ||
    n.includes("kitchen helper") ||
    n.includes("other hall expense") ||
    n.includes("other hall") ||
    n.includes("park helper") ||
    n.includes("extra chair") ||
    n.includes("උපස්ථායක") ||
    n.includes("කුස්සිය සහායක") ||
    n.includes("පාර්ක් හෙල්පර්") ||
    n.includes("අමතර පුටු") ||
    n.includes("වෙනත් වියදම්")
  );
};

// Check item object or name to ensure staff and operation items never leak to customer quotation
const isStaffOrOperationItem = (item) => {
  if (!item) return false;
  if (typeof item === "string") {
    return isStaffOrOperationItemName(item);
  }
  const cat = (item.Category || item.category || "").toLowerCase();
  if (cat === "operations" || cat === "operation" || cat === "staff") return true;
  const mult = (item.MultiplierType || item.multiplierType || "").toLowerCase();
  if (mult === "staff_200") return true;
  const name = item.ItemName || item.itemName || item.Description || item.description || "";
  return isStaffOrOperationItemName(name);
};

// Circular SVG Logo Component for clean vector rendering
const ElegantLogo = ({ isPrint = false }) => (
  <svg
    viewBox="0 0 100 100"
    className="logo-svg"
    style={{ width: isPrint ? "85px" : "42px", height: isPrint ? "85px" : "42px" }}
  >
    <circle cx="50" cy="50" r="46" fill="black" />
    <path
      d="M38 32 L44 40 L50 28 L56 40 L62 32 L58 45 L42 45 Z"
      fill="none"
      stroke="#d4af37"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <text
      x="50"
      y="63"
      fontFamily="'Playfair Display', Georgia, serif"
      fontWeight="700"
      fontStyle="italic"
      fill="white"
      fontSize="24"
      textAnchor="middle"
      letterSpacing="-0.5"
    >
      Jayani
    </text>
    <path d="M25 70 Q 50 78 75 70" fill="none" stroke="white" strokeWidth="1" />
    <text
      x="50"
      y="80"
      fontFamily="'Outfit', sans-serif"
      fontWeight="400"
      fill="#d4af37"
      fontSize="7"
      textAnchor="middle"
      letterSpacing="1"
    >
      RECEPTION HALL
    </text>
  </svg>
);

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [stats, setStats] = useState({
    TotalInvoiced: 0,
    TotalPaid: 0,
    TotalBalance: 0,
    TotalInvoicesCount: 0,
    TotalQuotationsCount: 0,
    TotalQuotedValue: 0
  });

  // Navigation State
  // activeTab: "invoices" | "quotations" | "items-master"
  const [activeTab, setActiveTab] = useState("invoices");
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" | "create" | "edit" | "create-quotation" | "edit-quotation"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Master Items Management State
  const [masterCategoryFilter, setMasterCategoryFilter] = useState("all");
  const [masterSearchQuery, setMasterSearchQuery] = useState("");
  const [showMasterItemModal, setShowMasterItemModal] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState(null);
  const [masterItemForm, setMasterItemForm] = useState({
    itemName: "",
    category: "buffet",
    multiplierType: "per_guest",
    baseQuantity: 1,
    unit: "Plate",
    costPrice: 0,
    sellingPrice: 0,
    quotationPriceType: "cost", // "cost" or "selling"
    notes: "",
    isActive: true,
    sortOrder: 0
  });

  // PDF Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null); // { type: "quotation" | "invoice", data: object, isDraft?: boolean }
  const [previewSheetMode, setPreviewSheetMode] = useState("customer"); // "customer" | "costing"
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfViewMode, setPdfViewMode] = useState("sheet"); // "sheet" | "pdf"
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Forms initial state
  const getInitialInvoiceForm = () => ({
    customerName: "",
    customerAddress: "",
    telephone: "",
    functionDate: "",
    functionType: "Wedding Date :Day function",
    notes: "",
    includeMenu: true,
    selectedMenu: ALL_BUFFET_OPTIONS,
    selectedDesserts: DESSERT_OPTIONS,
    selectedBites: [],
    selectedPackages: PACKAGE_OPTIONS,
    items: [{ ...DEFAULT_LINE_ITEM }],
    // Costing planner states (Wedding Package Sheet)
    guests: 150,
    profitMode: "percent", // "percent" | "fixed" | "target_plate" | "total_quoted"
    profitPercentage: 25,
    targetPlatePrice: 3400,
    fixedProfitAmount: 100000,
    totalQuotedAmount: 510000,
    plannedItems: [] // list of item selections
  });

  const getInitialQuotationForm = () => ({
    leadName: "",
    leadAddress: "",
    telephone: "",
    email: "",
    functionDate: "",
    validUntil: "",
    functionType: "Wedding Date :Day function",
    status: "Sent",
    notes: "",
    includeMenu: true,
    selectedMenu: ALL_BUFFET_OPTIONS,
    selectedDesserts: DESSERT_OPTIONS,
    selectedBites: [],
    selectedPackages: PACKAGE_OPTIONS,
    items: [{ ...DEFAULT_LINE_ITEM }],
    // Costing planner states (Wedding Package Sheet)
    guests: 150,
    profitMode: "percent", // "percent" | "fixed" | "target_plate" | "total_quoted"
    profitPercentage: 25,
    targetPlatePrice: 3400,
    fixedProfitAmount: 100000,
    totalQuotedAmount: 510000,
    plannedItems: [] // list of item selections
  });

  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState(getInitialInvoiceForm());

  // Quotation Form State (with Cost & Profit Planner)
  const [quotationForm, setQuotationForm] = useState(getInitialQuotationForm());

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    description: "Advanced Payment",
    amount: ""
  });

  useEffect(() => {
    fetchData();
    fetchMasterItems();
  }, []);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [invoicesRes, statsRes, quotationsRes] = await Promise.all([
        axios.get(`${API_BASE}/invoices`),
        axios.get(`${API_BASE}/dashboard/stats`),
        axios.get(`${API_BASE}/quotations`)
      ]);
      setInvoices(invoicesRes.data);
      setStats(statsRes.data);
      setQuotations(quotationsRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data from database. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterItems = async () => {
    try {
      const res = await axios.get(`${API_BASE}/master-items`);
      setMasterItems(res.data);
    } catch (err) {
      console.error("Failed to load master items catalog:", err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // =========================================================================
  // COST & PROFIT PLANNER LOGIC (WEDDING PACKAGE SHEET ENGINE)
  // =========================================================================
  // Initialize default planned items for quotation if empty
  const initializePlannedItemsFromMaster = () => {
    if (!masterItems || masterItems.length === 0) return [];

    // Default selection following Excel Wedding Package sheet
    // Buffet items (Rs. 845) + Desserts (Rs. 255) = EXACTLY Rs. 1,100 total menu cost per plate
    const defaultSelectedNames = [
      // Buffet Items & Welcome Drink (Total cost: Rs. 845)
      "පිළිගැනීමේ බීම (Welcome Drink)",
      "සුදු බත් (White Rice)",
      "එළවළු බත් (Vegetable Rice)",
      "කුකුළු මස් (Chicken Curry / Roast)",
      "මාළු (Fish Curry / Devilled)",
      "පරිප්පු (Dhal)",
      "අල (Potato Curry)",
      "කජු (Cashew Curry)",
      "බටු මෝජු (Brinjal Moju)",
      "අච්චාරු (Pickle)",
      "කට්ලට් (Buffet Cutlet)",
      "පපඩම් (Papadum)",
      "සලාද (Salad)",
      // Desserts (Total cost: Rs. 255)
      "වටලප්පන් (Watalappam)",
      "පළතුරු (Fruit Salad / Fresh Fruits)",
      "අයිස් ක්‍රීම් (Ice Cream)",
      "ජෙලි (Jelly)",
      "අයිස් කෝපි (Ice Coffee)",
      // Bites
      "Devilled Chicken (කුකුළු මස් බයිට්)",
      "Sausages (සොසේජස් බයිට්)",
      "Chickpeas (කඩල බයිට්)",
      "Mixed Bites / Murukku (මිශ්‍ර බයිට්)",
      "Cutlet (කට්ලට් බයිට්)",
      "Soft Drink (සොෆ්ට් ඩ්‍රින්ක්ස් සේවා)",
      "Serve Boys (උපස්ථායකයින්)",
      "Kitchen Helpers (කුස්සිය සහායකයින්)",
      "Other Hall Expenses (වෙනත් වියදම්)",
      "Dj (ඩීජේ සංගීතය)",
      "Kandyan Dancing Group (උඩරට නැටුම්)",
      "Sette Back (සෙටිබැක් සැරසිලි)",
      "Generator (ජෙනරේටර්)",
      "Ashtaka (අෂ්ටක)",
      "Jayamangala Gatha (ජයමංගල ගාථා)",
      "Oil Lamp (පොල්තෙල් පහන)",
      "Table Decoration (මේස සැරසිලි)",
      "Head Table Decoration (ප්‍රධාන මේස සැරසිලි)",
      "Entrance Decoration (පිවිසුම් සැරසිලි)",
      "Cake Structure (කේක් ව්‍යුහය)"
    ];

    return masterItems.map((item) => {
      const isSelected = defaultSelectedNames.includes(item.ItemName);
      return {
        itemId: item.ItemId,
        itemName: item.ItemName,
        category: item.Category,
        multiplierType: item.MultiplierType,
        baseQuantity: parseFloat(item.BaseQuantity) || 1,
        unit: item.Unit,
        costPrice: parseFloat(item.CostPrice) || 0,
        sellingPrice: parseFloat(item.SellingPrice) || 0,
        quotationPriceType: item.QuotationPriceType || "cost",
        selected: isSelected
      };
    });
  };

  // Identify active document view and drive common costing calculation
  const isInvoiceView = currentView === "create" || currentView === "edit";
  const activeDocForm = isInvoiceView ? invoiceForm : quotationForm;
  const setActiveDocForm = isInvoiceView ? setInvoiceForm : setQuotationForm;

  // Calculate live costing sheet values based on guests count and planned items
  const costingCalculation = useMemo(() => {
    const guests = parseInt(activeDocForm.guests) || 1;
    const bitesRatio = guests / 200; // Formula from Excel: D2 = C2 / 200

    const itemsToCalculate = (activeDocForm.plannedItems && activeDocForm.plannedItems.length > 0)
      ? activeDocForm.plannedItems
      : masterItems.map(item => ({
        itemId: item.ItemId,
        itemName: item.ItemName,
        category: item.Category,
        multiplierType: item.MultiplierType,
        baseQuantity: parseFloat(item.BaseQuantity) || 1,
        unit: item.Unit,
        costPrice: parseFloat(item.CostPrice) || 0,
        sellingPrice: parseFloat(item.SellingPrice) || 0,
        quotationPriceType: item.QuotationPriceType || "cost",
        selected: false
      }));

    const calculatedBreakdown = itemsToCalculate
      .filter((item) => item.selected)
      .map((item) => {
        let calcQty = 1;
        if (item.multiplierType === "per_guest") {
          // Buffet and Dessert multiply according to guest count
          calcQty = guests;
        } else if (item.multiplierType === "fixed") {
          // Package details multiply ONLY ONE
          calcQty = 1;
        } else if (item.multiplierType === "bites_200" || item.multiplierType === "staff_200") {
          // Bites & Staff default set for 200 guests and scale proportionally: Base * (Guests / 200)
          const rawQty = item.baseQuantity * bitesRatio;
          if (isStaffOrDiscreteItem(item)) {
            // Staff / persons (Serve boys, Kitchen helpers) cannot be decimal, round up to full quantity!
            calcQty = Math.ceil(rawQty);
            if (calcQty < 1 && guests > 0 && item.baseQuantity > 0) calcQty = 1;
          } else {
            calcQty = parseFloat(rawQty.toFixed(2));
          }
        }

        // Use selected price basis: Cost Price or Selling Price
        const priceBasis = item.quotationPriceType === "selling" ? "selling" : "cost";
        const effectiveRate = priceBasis === "selling" ? item.sellingPrice : item.costPrice;
        const totalCost = parseFloat((calcQty * effectiveRate).toFixed(2));
        const totalSelling = parseFloat((calcQty * item.sellingPrice).toFixed(2));

        return {
          ...item,
          quotationPriceType: priceBasis,
          effectiveRate,
          calcQty,
          totalCost,
          totalSelling
        };
      });

    // Handle extra chairs if guests > 200
    if (guests > 200) {
      const extraCount = guests - 200;
      const chairCost = extraCount * 100;
      calculatedBreakdown.push({
        itemId: 9999,
        itemName: "Extra chairs (අමතර පුටු)",
        category: "operations",
        multiplierType: "fixed",
        baseQuantity: extraCount,
        calcQty: extraCount,
        unit: "Chairs",
        costPrice: 100,
        sellingPrice: 150,
        totalCost: chairCost,
        totalSelling: extraCount * 150,
        selected: true
      });
    }

    const totalCost = calculatedBreakdown.reduce((sum, it) => sum + it.totalCost, 0);
    const costPerPlate = guests > 0 ? parseFloat((totalCost / guests).toFixed(2)) : 0;

    let profitAmount = 0;
    let totalSellingPrice = 0;
    let calculatedPlatePrice = 0;

    if (activeDocForm.profitMode === "target_plate" || activeDocForm.profitMode === "plate_price") {
      const targetPlate = parseFloat(activeDocForm.targetPlatePrice) || 0;
      totalSellingPrice = parseFloat((targetPlate * guests).toFixed(2));
      profitAmount = parseFloat((totalSellingPrice - totalCost).toFixed(2));
      calculatedPlatePrice = targetPlate;
    } else if (activeDocForm.profitMode === "total_quoted") {
      const targetTotal = parseFloat(activeDocForm.totalQuotedAmount) || 0;
      totalSellingPrice = targetTotal;
      profitAmount = parseFloat((targetTotal - totalCost).toFixed(2));
      calculatedPlatePrice = guests > 0 ? parseFloat((totalSellingPrice / guests).toFixed(2)) : 0;
    } else if (activeDocForm.profitMode === "fixed" || activeDocForm.profitMode === "profit_amount") {
      profitAmount = parseFloat(activeDocForm.fixedProfitAmount) || 0;
      totalSellingPrice = parseFloat((totalCost + profitAmount).toFixed(2));
      calculatedPlatePrice = guests > 0 ? parseFloat((totalSellingPrice / guests).toFixed(2)) : 0;
    } else {
      // Default: Percent profit margin on cost (Excel: Expected Profit = Cost * 0.25)
      const pct = parseFloat(activeDocForm.profitPercentage) || 25;
      profitAmount = parseFloat((totalCost * (pct / 100)).toFixed(2));
      totalSellingPrice = parseFloat((totalCost + profitAmount).toFixed(2));
      calculatedPlatePrice = guests > 0 ? parseFloat((totalSellingPrice / guests).toFixed(2)) : 0;
    }

    const profitPercentage = totalCost > 0 ? parseFloat(((profitAmount / totalCost) * 100).toFixed(1)) : 0;

    return {
      guests,
      bitesRatio,
      calculatedBreakdown,
      totalCost,
      costPerPlate,
      profitAmount,
      profitPercentage,
      totalSellingPrice,
      calculatedPlatePrice
    };
  }, [
    activeDocForm.guests,
    activeDocForm.plannedItems,
    activeDocForm.profitMode,
    activeDocForm.profitPercentage,
    activeDocForm.fixedProfitAmount,
    activeDocForm.targetPlatePrice,
    activeDocForm.totalQuotedAmount,
    masterItems
  ]);

  // Live 3-Way Profit, Total Quoted/Invoiced, and Plate Price Recalculation Handlers
  const handleProfitAmountChange = (val) => {
    const guests = parseInt(activeDocForm.guests) || 1;
    const totalCost = costingCalculation.totalCost;
    const num = val === "" ? "" : parseFloat(val);
    const numVal = typeof num === "number" && !isNaN(num) ? num : 0;
    const totalSelling = parseFloat((totalCost + numVal).toFixed(2));
    const platePrice = guests > 0 ? parseFloat((totalSelling / guests).toFixed(2)) : 0;
    const pct = totalCost > 0 ? parseFloat(((numVal / totalCost) * 100).toFixed(2)) : 0;

    setActiveDocForm((prev) => {
      const updatedItems = prev.items && prev.items.length > 0
        ? [{ ...prev.items[0], quantity: guests, unitPrice: platePrice }]
        : [{ ...DEFAULT_LINE_ITEM, quantity: guests, unitPrice: platePrice }];

      return {
        ...prev,
        profitMode: "fixed",
        fixedProfitAmount: num,
        profitPercentage: pct,
        totalQuotedAmount: totalSelling,
        targetPlatePrice: platePrice,
        items: updatedItems
      };
    });
  };

  const handleProfitPercentageChange = (val) => {
    const guests = parseInt(activeDocForm.guests) || 1;
    const totalCost = costingCalculation.totalCost;
    const pct = val === "" ? "" : parseFloat(val);
    const pctVal = typeof pct === "number" && !isNaN(pct) ? pct : 0;
    const profit = parseFloat((totalCost * (pctVal / 100)).toFixed(2));
    const totalSelling = parseFloat((totalCost + profit).toFixed(2));
    const platePrice = guests > 0 ? parseFloat((totalSelling / guests).toFixed(2)) : 0;

    setActiveDocForm((prev) => {
      const updatedItems = prev.items && prev.items.length > 0
        ? [{ ...prev.items[0], quantity: guests, unitPrice: platePrice }]
        : [{ ...DEFAULT_LINE_ITEM, quantity: guests, unitPrice: platePrice }];

      return {
        ...prev,
        profitMode: "percent",
        profitPercentage: pct,
        fixedProfitAmount: profit,
        totalQuotedAmount: totalSelling,
        targetPlatePrice: platePrice,
        items: updatedItems
      };
    });
  };

  const handleTotalQuotedChange = (val) => {
    const guests = parseInt(activeDocForm.guests) || 1;
    const totalCost = costingCalculation.totalCost;
    const totalSelling = val === "" ? "" : parseFloat(val);
    const totalSellingVal = typeof totalSelling === "number" && !isNaN(totalSelling) ? totalSelling : 0;
    const profit = parseFloat((totalSellingVal - totalCost).toFixed(2));
    const platePrice = guests > 0 ? parseFloat((totalSellingVal / guests).toFixed(2)) : 0;
    const pct = totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(2)) : 0;

    setActiveDocForm((prev) => {
      const updatedItems = prev.items && prev.items.length > 0
        ? [{ ...prev.items[0], quantity: guests, unitPrice: platePrice }]
        : [{ ...DEFAULT_LINE_ITEM, quantity: guests, unitPrice: platePrice }];

      return {
        ...prev,
        profitMode: "total_quoted",
        totalQuotedAmount: totalSelling,
        fixedProfitAmount: profit,
        profitPercentage: pct,
        targetPlatePrice: platePrice,
        items: updatedItems
      };
    });
  };

  const handlePlatePriceChange = (val) => {
    const guests = parseInt(activeDocForm.guests) || 1;
    const totalCost = costingCalculation.totalCost;
    const platePrice = val === "" ? "" : parseFloat(val);
    const platePriceVal = typeof platePrice === "number" && !isNaN(platePrice) ? platePrice : 0;
    const totalSelling = parseFloat((platePriceVal * guests).toFixed(2));
    const profit = parseFloat((totalSelling - totalCost).toFixed(2));
    const pct = totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(2)) : 0;

    setActiveDocForm((prev) => {
      const updatedItems = prev.items && prev.items.length > 0
        ? [{ ...prev.items[0], quantity: guests, unitPrice: platePriceVal }]
        : [{ ...DEFAULT_LINE_ITEM, quantity: guests, unitPrice: platePriceVal }];

      return {
        ...prev,
        profitMode: "target_plate",
        targetPlatePrice: platePrice,
        totalQuotedAmount: totalSelling,
        fixedProfitAmount: profit,
        profitPercentage: pct,
        items: updatedItems
      };
    });
  };

  const handleGuestsChange = (val) => {
    const guests = parseInt(val) || 1;
    setActiveDocForm((prev) => {
      const updatedItems = prev.items && prev.items.length > 0
        ? [{ ...prev.items[0], quantity: guests }]
        : [{ ...DEFAULT_LINE_ITEM, quantity: guests }];

      return {
        ...prev,
        guests,
        items: updatedItems
      };
    });
  };

  // Synchronize the Costing Sheet calculations into Line Item (Quotation or Invoice)
  const handleSyncPlannerToLineItems = (isInvoice = false) => {
    const { guests, totalCost, profitAmount, profitPercentage, costPerPlate, totalSellingPrice, calculatedPlatePrice, calculatedBreakdown } = costingCalculation;

    // Build comprehensive description (strictly customer-facing: buffet, desserts, bites, packages)
    const plannedDessertItems = calculatedBreakdown
      .filter((it) => it.category === "dessert" && !isStaffOrOperationItem(it))
      .map((it) => it.itemName);
    const plannedBuffetItems = calculatedBreakdown
      .filter((it) => it.category === "buffet" && !isStaffOrOperationItem(it))
      .map((it) => it.itemName);
    const bitesItems = calculatedBreakdown
      .filter((it) => it.category === "bites" && !isStaffOrOperationItem(it))
      .map((it) => `${it.itemName.split(" ")[0]} ${it.calcQty}${it.unit}`);
    const packageItems = calculatedBreakdown
      .filter((it) => it.category === "package" && !isStaffOrOperationItem(it))
      .map((it) => it.itemName.split(" ")[0]);

    let buffetName = plannedBuffetItems.length > 0 ? plannedBuffetItems[0].split("(")[0].trim() : "Buffet Menu";
    let desc = buffetName;
    if (plannedDessertItems.length > 0) {
      desc += ` + Desserts (${plannedDessertItems.map(d => d.split("(")[0].trim()).join(", ")})`;
    }
    if (bitesItems.length > 0) {
      desc += `, ${String(bitesItems.length).padStart(2, "0")} Bites (${bitesItems.join(", ")})`;
    }
    if (packageItems.length > 0) {
      desc += `, ${packageItems.join(", ")}`;
    }

    // Set line item
    setActiveDocForm((prev) => ({
      ...prev,
      items: [
        {
          description: desc,
          quantity: guests,
          unitPrice: calculatedPlatePrice
        }
      ],
      selectedDesserts: plannedDessertItems.length > 0 ? plannedDessertItems : prev.selectedDesserts,
      selectedMenu: plannedBuffetItems.length > 0 ? plannedBuffetItems : prev.selectedMenu,
      selectedBites: calculatedBreakdown.filter((it) => it.category === "bites" && !isStaffOrOperationItem(it)).map((it) => it.itemName),
      selectedPackages: calculatedBreakdown.filter((it) => it.category === "package" && !isStaffOrOperationItem(it)).map((it) => it.itemName),
      totalCost,
      profitAmount,
      profitPercentage,
      costPerPlate
    }));

    const docType = isInvoice ? "Invoice" : "Quotation";
    alert(`Synchronized ${docType}! Guests: ${guests}, Plate Price: Rs. ${formatCurrency(calculatedPlatePrice)}, Total: Rs. ${formatCurrency(totalSellingPrice)}`);
  };

  const handleSyncPlannerToQuotationLineItems = () => handleSyncPlannerToLineItems(false);
  const handleSyncPlannerToInvoiceLineItems = () => handleSyncPlannerToLineItems(true);

  const handleTogglePlannedItem = (itemId) => {
    setActiveDocForm((prev) => {
      const currentList = prev.plannedItems && prev.plannedItems.length > 0
        ? prev.plannedItems
        : initializePlannedItemsFromMaster(prev.guests);

      const toggledItem = currentList.find((it) => it.itemId === itemId);
      const isOperations = toggledItem && (toggledItem.category === "operations" || isStaffOrOperationItem(toggledItem));

      const updated = currentList.map((item) =>
        item.itemId === itemId ? { ...item, selected: !item.selected } : item
      );

      // If toggled item is staff or operations, update planned items for internal costing only
      // NEVER touch customer quotation/invoice inclusions!
      if (isOperations) {
        return {
          ...prev,
          plannedItems: updated
        };
      }

      // Automatically keep customer inclusions in sync with user's selected planner items
      // (STRICTLY EXCLUDING operations/staff!)
      const activeBites = updated.filter((it) => it.selected && it.category === "bites" && !isStaffOrOperationItem(it)).map((it) => it.itemName);
      const activePackages = updated.filter((it) => it.selected && it.category === "package" && !isStaffOrOperationItem(it)).map((it) => it.itemName);
      const activeDesserts = updated.filter((it) => it.selected && it.category === "dessert" && !isStaffOrOperationItem(it)).map((it) => it.itemName);
      const activeBuffet = updated.filter((it) => it.selected && it.category === "buffet" && !isStaffOrOperationItem(it)).map((it) => it.itemName);

      return {
        ...prev,
        plannedItems: updated,
        selectedBites: activeBites,
        selectedPackages: activePackages,
        selectedDesserts: activeDesserts.length > 0 ? activeDesserts : prev.selectedDesserts,
        selectedMenu: activeBuffet.length > 0 ? activeBuffet : prev.selectedMenu
      };
    });
  };

  // =========================================================================
  // MASTER ITEMS CRUD HANDLERS
  // =========================================================================
  const handleOpenAddMasterItem = () => {
    setEditingMasterItem(null);
    setMasterItemForm({
      itemName: "",
      category: "buffet",
      multiplierType: "per_guest",
      baseQuantity: 1,
      unit: "Plate",
      costPrice: 0,
      sellingPrice: 0,
      quotationPriceType: "cost", // "cost" or "selling"
      notes: "",
      isActive: true,
      sortOrder: masterItems.length + 1
    });
    setShowMasterItemModal(true);
  };

  const handleOpenEditMasterItem = (item) => {
    setEditingMasterItem(item);
    setMasterItemForm({
      itemName: item.ItemName,
      category: item.Category,
      multiplierType: item.MultiplierType,
      baseQuantity: item.BaseQuantity,
      unit: item.Unit,
      costPrice: item.CostPrice,
      sellingPrice: item.SellingPrice,
      quotationPriceType: item.QuotationPriceType || "cost",
      notes: item.Notes || "",
      isActive: item.IsActive !== false,
      sortOrder: item.SortOrder || 0
    });
    setShowMasterItemModal(true);
  };

  const handleToggleMasterPriceType = async (item) => {
    const currentType = item.QuotationPriceType === "selling" ? "selling" : "cost";
    const newType = currentType === "selling" ? "cost" : "selling";
    try {
      await axios.patch(`${API_BASE}/master-items/${item.ItemId}/price-type`, {
        quotationPriceType: newType
      });
      fetchMasterItems();
    } catch (err) {
      console.error(err);
      alert("Failed to update quotation price basis");
    }
  };

  const handleTogglePlannedItemPriceType = (itemId, e) => {
    if (e) e.stopPropagation();
    setActiveDocForm((prev) => {
      const currentList = prev.plannedItems && prev.plannedItems.length > 0
        ? prev.plannedItems
        : initializePlannedItemsFromMaster();

      const updated = currentList.map((item) => {
        if (item.itemId === itemId) {
          const currentType = item.quotationPriceType === "selling" ? "selling" : "cost";
          const newType = currentType === "selling" ? "cost" : "selling";
          return { ...item, quotationPriceType: newType };
        }
        return item;
      });

      return {
        ...prev,
        plannedItems: updated
      };
    });
  };

  const handleSetAllPlannedPriceType = (type) => {
    setActiveDocForm((prev) => {
      const currentList = prev.plannedItems && prev.plannedItems.length > 0
        ? prev.plannedItems
        : initializePlannedItemsFromMaster();

      const updated = currentList.map((item) => {
        if (type === "master") {
          const master = masterItems.find((m) => m.ItemId === item.itemId);
          return { ...item, quotationPriceType: master?.QuotationPriceType || "cost" };
        }
        return { ...item, quotationPriceType: type };
      });

      return {
        ...prev,
        plannedItems: updated
      };
    });
  };

  const handleSaveMasterItem = async (e) => {
    e.preventDefault();
    try {
      if (editingMasterItem) {
        await axios.put(`${API_BASE}/master-items/${editingMasterItem.ItemId}`, masterItemForm);
      } else {
        await axios.post(`${API_BASE}/master-items`, masterItemForm);
      }
      setShowMasterItemModal(false);
      fetchMasterItems();
    } catch (err) {
      console.error(err);
      alert("Error saving item to master catalog");
    }
  };

  const handleDeleteMasterItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this master item?")) {
      try {
        await axios.delete(`${API_BASE}/master-items/${itemId}`);
        fetchMasterItems();
      } catch (err) {
        console.error(err);
        alert("Failed to delete master item");
      }
    }
  };

  const handleResetMasterItemsFromExcel = async () => {
    if (window.confirm("Restore all default items and cost rates from the Excel Wedding Package sheet? Any custom item additions will be refreshed.")) {
      try {
        await axios.post(`${API_BASE}/master-items/seed`);
        fetchMasterItems();
        alert("Master items successfully re-seeded from Excel Wedding Package sheet!");
      } catch (err) {
        console.error(err);
        alert("Failed to restore master items");
      }
    }
  };

  // =========================================================================
  // INVOICE & QUOTATION CRUD OPERATIONS
  // =========================================================================
  const handleAddFormItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const handleRemoveFormItem = (index) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleFormItemChange = (index, field, value) => {
    setInvoiceForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleOpenCreateInvoice = () => {
    const initialInv = getInitialInvoiceForm();
    const planned = initializePlannedItemsFromMaster(150);
    initialInv.plannedItems = planned;
    initialInv.selectedBites = planned.filter((it) => it.selected && it.category === "bites").map((it) => it.itemName);
    initialInv.selectedPackages = planned.filter((it) => it.selected && it.category === "package").map((it) => it.itemName);
    initialInv.selectedDesserts = planned.filter((it) => it.selected && it.category === "dessert").map((it) => it.itemName);
    initialInv.selectedMenu = planned.filter((it) => it.selected && it.category === "buffet").map((it) => it.itemName);
    if (initialInv.selectedDesserts.length === 0) initialInv.selectedDesserts = DESSERT_OPTIONS;
    if (initialInv.selectedMenu.length === 0) initialInv.selectedMenu = ALL_BUFFET_OPTIONS;

    setInvoiceForm(initialInv);
    setCurrentView("create");
  };

  const handleCreateOrUpdateInvoice = async (e) => {
    e.preventDefault();
    try {
      const { totalCost, profitAmount, profitPercentage, costPerPlate, calculatedBreakdown } = costingCalculation;

      const payload = {
        ...invoiceForm,
        guests: costingCalculation.guests,
        platePrice: costingCalculation.calculatedPlatePrice,
        totalPrice: costingCalculation.totalSellingPrice,
        selectedMenu: Array.isArray(invoiceForm.selectedMenu) ? invoiceForm.selectedMenu.join(",") : (invoiceForm.selectedMenu || ""),
        selectedDesserts: Array.isArray(invoiceForm.selectedDesserts) ? invoiceForm.selectedDesserts.join(",") : (invoiceForm.selectedDesserts || ""),
        selectedBites: Array.isArray(invoiceForm.selectedBites) ? invoiceForm.selectedBites.join(",") : (invoiceForm.selectedBites || ""),
        selectedPackages: Array.isArray(invoiceForm.selectedPackages) ? invoiceForm.selectedPackages.join(",") : (invoiceForm.selectedPackages || ""),
        totalCost,
        profitAmount,
        profitPercentage,
        costPerPlate,
        costBreakdownJson: JSON.stringify(calculatedBreakdown)
      };

      if (currentView === "create") {
        await axios.post(`${API_BASE}/invoices`, payload);
      } else {
        await axios.put(`${API_BASE}/invoices/${selectedInvoice.InvoiceId}`, payload);
      }
      fetchData();
      setActiveTab("invoices");
      setCurrentView("dashboard");
      setInvoiceForm(getInitialInvoiceForm());
    } catch (err) {
      console.error(err);
      alert("Error saving invoice. Please check the inputs.");
    }
  };

  const handleEditClick = async (inv) => {
    try {
      const res = await axios.get(`${API_BASE}/invoices/${inv.InvoiceId}`);
      const detailedInv = res.data;
      setSelectedInvoice(detailedInv);

      let loadedBreakdown = [];
      if (detailedInv.CostBreakdownJson) {
        try {
          loadedBreakdown = JSON.parse(detailedInv.CostBreakdownJson);
        } catch {
          loadedBreakdown = [];
        }
      }

      setInvoiceForm({
        customerName: detailedInv.CustomerName || "",
        customerAddress: detailedInv.CustomerAddress || "",
        telephone: detailedInv.Telephone || "",
        functionDate: detailedInv.FunctionDate ? detailedInv.FunctionDate.split("T")[0] : "",
        functionType: detailedInv.FunctionType || "Wedding Date :Day function",
        includeMenu: detailedInv.IncludeMenu !== false,
        notes: detailedInv.Notes || "",
        selectedMenu: detailedInv.SelectedMenu
          ? detailedInv.SelectedMenu.split(",").filter((i) => !DESSERT_OPTIONS.includes(i) && !isStaffOrOperationItemName(i))
          : ALL_BUFFET_OPTIONS,
        selectedDesserts: detailedInv.SelectedDesserts
          ? detailedInv.SelectedDesserts.split(",").filter((i) => !isStaffOrOperationItemName(i))
          : (detailedInv.SelectedMenu ? detailedInv.SelectedMenu.split(",").filter((i) => DESSERT_OPTIONS.includes(i) && !isStaffOrOperationItemName(i)) : DESSERT_OPTIONS),
        selectedBites: detailedInv.SelectedBites ? detailedInv.SelectedBites.split(",").filter((i) => !isStaffOrOperationItemName(i)) : [],
        selectedPackages: detailedInv.SelectedPackages ? detailedInv.SelectedPackages.split(",").filter((i) => !isStaffOrOperationItemName(i)) : [],
        guests: detailedInv.Guests || 150,
        profitMode: "target_plate",
        profitPercentage: detailedInv.ProfitPercentage || 25,
        targetPlatePrice: detailedInv.PlatePrice || 3400,
        fixedProfitAmount: detailedInv.ProfitAmount || 0,
        totalQuotedAmount: detailedInv.TotalPrice || 510000,
        plannedItems: loadedBreakdown.length > 0 ? loadedBreakdown : initializePlannedItemsFromMaster(detailedInv.Guests || 150),
        items:
          detailedInv.items && detailedInv.items.length > 0
            ? detailedInv.items.map((item) => ({
              description: item.Description,
              quantity: item.Quantity,
              unitPrice: item.UnitPrice
            }))
            : [
              {
                description: detailedInv.BillDetails || "Buffet Menu",
                quantity: detailedInv.Guests || 150,
                unitPrice: detailedInv.PlatePrice || 3400
              }
            ]
      });
      setCurrentView("edit");
    } catch (err) {
      console.error(err);
      alert("Failed to load invoice details for editing");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await axios.delete(`${API_BASE}/invoices/${invoiceId}`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete invoice");
      }
    }
  };

  // Quotation Handlers
  const handleOpenCreateQuotation = () => {
    const initialQuo = getInitialQuotationForm();
    const planned = initializePlannedItemsFromMaster(150);
    initialQuo.plannedItems = planned;
    // Set customer quotation inclusions to the default selected items from planner (strictly excluding operations/staff)
    initialQuo.selectedBites = planned.filter((it) => it.selected && it.category === "bites").map((it) => it.itemName);
    initialQuo.selectedPackages = planned.filter((it) => it.selected && it.category === "package").map((it) => it.itemName);
    initialQuo.selectedDesserts = planned.filter((it) => it.selected && it.category === "dessert").map((it) => it.itemName);
    initialQuo.selectedMenu = planned.filter((it) => it.selected && it.category === "buffet").map((it) => it.itemName);
    if (initialQuo.selectedDesserts.length === 0) initialQuo.selectedDesserts = DESSERT_OPTIONS;
    if (initialQuo.selectedMenu.length === 0) initialQuo.selectedMenu = ALL_BUFFET_OPTIONS;

    setQuotationForm(initialQuo);
    setCurrentView("create-quotation");
  };

  const handleCreateOrUpdateQuotation = async (e) => {
    e.preventDefault();
    try {
      const { totalCost, profitAmount, profitPercentage, costPerPlate, calculatedBreakdown } = costingCalculation;

      const payload = {
        ...quotationForm,
        guests: costingCalculation.guests,
        platePrice: costingCalculation.calculatedPlatePrice,
        totalPrice: costingCalculation.totalSellingPrice,
        selectedMenu: Array.isArray(quotationForm.selectedMenu) ? quotationForm.selectedMenu.join(",") : (quotationForm.selectedMenu || ""),
        selectedDesserts: Array.isArray(quotationForm.selectedDesserts) ? quotationForm.selectedDesserts.join(",") : (quotationForm.selectedDesserts || ""),
        selectedBites: Array.isArray(quotationForm.selectedBites) ? quotationForm.selectedBites.join(",") : (quotationForm.selectedBites || ""),
        selectedPackages: Array.isArray(quotationForm.selectedPackages) ? quotationForm.selectedPackages.join(",") : (quotationForm.selectedPackages || ""),
        totalCost,
        profitAmount,
        profitPercentage,
        costPerPlate,
        costBreakdownJson: JSON.stringify(calculatedBreakdown)
      };

      if (currentView === "create-quotation") {
        await axios.post(`${API_BASE}/quotations`, payload);
      } else {
        await axios.put(`${API_BASE}/quotations/${selectedQuotation.QuotationId}`, payload);
      }
      fetchData();
      setActiveTab("quotations");
      setCurrentView("dashboard");
      setQuotationForm(getInitialQuotationForm());
    } catch (err) {
      console.error(err);
      alert("Error saving quotation. Please check the inputs.");
    }
  };

  const handleEditQuotationClick = async (quo) => {
    try {
      const res = await axios.get(`${API_BASE}/quotations/${quo.QuotationId}`);
      const detailedQuo = res.data;
      setSelectedQuotation(detailedQuo);

      let loadedBreakdown = [];
      if (detailedQuo.CostBreakdownJson) {
        try {
          loadedBreakdown = JSON.parse(detailedQuo.CostBreakdownJson);
        } catch {
          loadedBreakdown = [];
        }
      }

      setQuotationForm({
        leadName: detailedQuo.LeadName || "",
        leadAddress: detailedQuo.LeadAddress || "",
        telephone: detailedQuo.Telephone || "",
        email: detailedQuo.Email || "",
        functionDate: detailedQuo.FunctionDate ? detailedQuo.FunctionDate.split("T")[0] : "",
        validUntil: detailedQuo.ValidUntil ? detailedQuo.ValidUntil.split("T")[0] : "",
        functionType: detailedQuo.FunctionType || "Wedding Date :Day function",
        status: detailedQuo.Status || "Sent",
        notes: detailedQuo.Notes || "",
        includeMenu: detailedQuo.IncludeMenu !== false,
        selectedMenu: detailedQuo.SelectedMenu
          ? detailedQuo.SelectedMenu.split(",").filter((i) => !DESSERT_OPTIONS.includes(i) && !isStaffOrOperationItemName(i))
          : ALL_BUFFET_OPTIONS,
        selectedDesserts: detailedQuo.SelectedDesserts
          ? detailedQuo.SelectedDesserts.split(",").filter((i) => !isStaffOrOperationItemName(i))
          : (detailedQuo.SelectedMenu ? detailedQuo.SelectedMenu.split(",").filter((i) => DESSERT_OPTIONS.includes(i) && !isStaffOrOperationItemName(i)) : DESSERT_OPTIONS),
        selectedBites: detailedQuo.SelectedBites ? detailedQuo.SelectedBites.split(",").filter((i) => !isStaffOrOperationItemName(i)) : [],
        selectedPackages: detailedQuo.SelectedPackages ? detailedQuo.SelectedPackages.split(",").filter((i) => !isStaffOrOperationItemName(i)) : [],
        guests: detailedQuo.Guests || 150,
        profitMode: "target_plate",
        profitPercentage: detailedQuo.ProfitPercentage || 25,
        targetPlatePrice: detailedQuo.PlatePrice || 3400,
        fixedProfitAmount: detailedQuo.ProfitAmount || 0,
        plannedItems: loadedBreakdown.length > 0 ? loadedBreakdown : initializePlannedItemsFromMaster(detailedQuo.Guests || 150),
        items:
          detailedQuo.items && detailedQuo.items.length > 0
            ? detailedQuo.items.map((item) => ({
              description: item.Description,
              quantity: item.Quantity,
              unitPrice: item.UnitPrice
            }))
            : [
              {
                description: detailedQuo.BillDetails || "Buffet Menu",
                quantity: detailedQuo.Guests,
                unitPrice: detailedQuo.PlatePrice
              }
            ]
      });
      setCurrentView("edit-quotation");
    } catch (err) {
      console.error(err);
      alert("Failed to load quotation details for editing");
    }
  };

  const handleDeleteQuotation = async (quotationId) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await axios.delete(`${API_BASE}/quotations/${quotationId}`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete quotation");
      }
    }
  };

  const handleConvertQuotationToInvoice = async (quo) => {
    if (
      window.confirm(
        `Convert quotation ${quo.QuotationNumber} for "${quo.LeadName}" into an official Invoice?`
      )
    ) {
      try {
        const res = await axios.post(`${API_BASE}/quotations/${quo.QuotationId}/convert`);
        await fetchData();
        setActiveTab("invoices");
        alert(`Successfully created Invoice ${res.data.invoiceNumber} from Quotation ${quo.QuotationNumber}!`);
      } catch (err) {
        console.error(err);
        alert("Failed to convert quotation to invoice.");
      }
    }
  };

  // Payments Handlers
  const handleOpenPayment = async (inv) => {
    setSelectedInvoice(inv);
    try {
      const res = await axios.get(`${API_BASE}/invoices/${inv.InvoiceId}`);
      setSelectedInvoice(res.data);
      const paidCount = res.data.payments.length;
      let nextPaymentType = "Advanced Payment";
      if (paidCount === 1) nextPaymentType = "Second Payment";
      else if (paidCount > 1) nextPaymentType = "Final Balance";

      setPaymentForm({
        paymentDate: new Date().toISOString().split("T")[0],
        description: nextPaymentType,
        amount: res.data.TotalBalance > 0 ? res.data.TotalBalance : ""
      });
      setShowPaymentModal(true);
    } catch (err) {
      console.error(err);
      alert("Error loading invoice payments");
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    try {
      await axios.post(`${API_BASE}/invoices/${selectedInvoice.InvoiceId}/payments`, paymentForm);
      const detailRes = await axios.get(`${API_BASE}/invoices/${selectedInvoice.InvoiceId}`);
      setSelectedInvoice(detailRes.data);
      fetchData();
      setPaymentForm({
        paymentDate: new Date().toISOString().split("T")[0],
        description: "Advanced Payment",
        amount: ""
      });
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to record payment");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Are you sure you want to delete this payment record?")) {
      try {
        await axios.delete(`${API_BASE}/payments/${paymentId}`);
        const detailRes = await axios.get(`${API_BASE}/invoices/${selectedInvoice.InvoiceId}`);
        setSelectedInvoice(detailRes.data);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete payment");
      }
    }
  };

  // =========================================================================
  // PDF PREVIEW, PRINT & DOWNLOAD LOGIC
  // =========================================================================
  const buildPdfObjectFromElement = async (elementId = "printable-invoice") => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    const needsForceShow = element.classList.contains("invoice-print-container");
    if (needsForceShow) {
      element.classList.add("force-show-for-pdf");
    }

    try {
      // 1. Gather all potential break boundaries from the DOM
      const elementRect = element.getBoundingClientRect();
      const selectors = [
        ".print-header",
        ".print-doc-banner",
        ".print-meta-grid",
        ".print-meta-box",
        ".print-menu-box",
        ".print-menu-item",
        ".print-terms-section",
        ".print-terms-title",
        ".print-terms-section li",
        ".print-signature-row",
        ".print-bill-section",
        ".print-bill-header-row",
        ".print-bill-data-row",
        ".print-payment-section",
        ".print-payment-row",
        ".no-break",
        "tr",
        "h1", "h2", "h3", "h4",
        ".print-hr"
      ];

      const queried = element.querySelectorAll(selectors.join(", "));
      const domBreakpoints = [];
      queried.forEach((el) => {
        const r = el.getBoundingClientRect();
        const topPx = r.top - elementRect.top;
        const bottomPx = r.bottom - elementRect.top;
        const heightPx = r.height;
        if (heightPx > 0) {
          domBreakpoints.push({ topPx, bottomPx, heightPx });
        }
      });

      // 2. Render DOM to high-res canvas via html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
      const pdfWidthMm = 210;
      const pdfHeightMm = 297;
      const totalCanvasWidth = canvas.width;
      const totalCanvasHeight = canvas.height;

      // Scale between DOM layout and canvas pixels
      const scaleY = totalCanvasHeight / Math.max(elementRect.height, 1);
      const a4PageHeightPx = (pdfHeightMm / pdfWidthMm) * totalCanvasWidth;

      // Check if document fits on a single A4 page (with 15px tolerance)
      if (totalCanvasHeight <= a4PageHeightPx + 15) {
        const imgData = canvas.toDataURL("image/jpeg", 0.90);
        const renderedHeightMm = (totalCanvasHeight * pdfWidthMm) / totalCanvasWidth;
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidthMm, Math.min(pdfHeightMm, renderedHeightMm), undefined, "FAST");
        return pdf;
      }

      // Convert DOM breakpoints to canvas pixel coordinates
      const canvasBreakpoints = domBreakpoints.map((b) => ({
        top: b.topPx * scaleY,
        bottom: b.bottomPx * scaleY,
        height: b.heightPx * scaleY
      })).sort((a, b) => a.top - b.top);

      // Multi-page smart canvas slicing (prevents any element from being sliced horizontally)
      let currentTopPx = 0;
      let pageIndex = 0;

      while (currentTopPx < totalCanvasHeight - 10) {
        // Page margins: Page 1 already has top padding; page >= 1 receives a 10mm top margin
        const topMarginMm = pageIndex === 0 ? 0 : 10;
        const bottomMarginMm = 8;
        const availableHeightMm = pdfHeightMm - topMarginMm - bottomMarginMm;
        const maxPageContentHeightPx = (availableHeightMm / pdfWidthMm) * totalCanvasWidth;

        let targetBottomPx = currentTopPx + maxPageContentHeightPx;

        if (targetBottomPx >= totalCanvasHeight - 15) {
          targetBottomPx = totalCanvasHeight;
        } else {
          // Find safe cut point <= targetBottomPx that avoids cutting elements in half
          let safeCutPx = targetBottomPx;

          for (let i = canvasBreakpoints.length - 1; i >= 0; i--) {
            const cand = canvasBreakpoints[i];
            if (cand.top < safeCutPx && cand.bottom > safeCutPx) {
              // Only pull back if leaving at least 25% of page content height
              if (cand.top > currentTopPx + maxPageContentHeightPx * 0.25) {
                safeCutPx = cand.top;
              }
            }
          }

          // Fallback if safeCutPx did not make forward progress
          if (safeCutPx <= currentTopPx + 50) {
            safeCutPx = targetBottomPx;
          }
          targetBottomPx = safeCutPx;
        }

        const sliceHeightPx = Math.round(targetBottomPx - currentTopPx);
        if (sliceHeightPx <= 0) break;

        // Create discrete slice canvas for this page
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = totalCanvasWidth;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0, currentTopPx, totalCanvasWidth, sliceHeightPx,
          0, 0, totalCanvasWidth, sliceHeightPx
        );

        const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.90);
        const sliceHeightMm = (sliceHeightPx * pdfWidthMm) / totalCanvasWidth;

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(sliceImgData, "JPEG", 0, topMarginMm, pdfWidthMm, sliceHeightMm, undefined, "FAST");

        currentTopPx = targetBottomPx;
        pageIndex++;
        if (pageIndex > 25) break; // Guard against infinite loop
      }

      return pdf;
    } finally {
      if (needsForceShow) {
        element.classList.remove("force-show-for-pdf");
      }
    }
  };

  const handlePreviewQuotation = async (quo, initialMode = "customer") => {
    try {
      const res = await axios.get(`${API_BASE}/quotations/${quo.QuotationId}`);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl("");
      setPdfViewMode("sheet");
      setPreviewSheetMode(initialMode);
      setPreviewDoc({ type: "quotation", data: res.data, isDraft: false });
      setShowPdfPreview(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load quotation for PDF preview");
    }
  };

  const handlePreviewInvoice = async (inv, initialMode = "customer") => {
    try {
      const res = await axios.get(`${API_BASE}/invoices/${inv.InvoiceId}`);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl("");
      setPdfViewMode("sheet");
      setPreviewSheetMode(initialMode);
      setPreviewDoc({ type: "invoice", data: res.data, isDraft: false });
      setShowPdfPreview(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load invoice for PDF preview");
    }
  };

  const handlePreviewQuotationForm = () => {
    const { totalCost, profitAmount, profitPercentage, costPerPlate, totalSellingPrice, calculatedPlatePrice, calculatedBreakdown, guests } = costingCalculation;

    const draftData = {
      QuotationId: selectedQuotation?.QuotationId || null,
      QuotationNumber:
        currentView === "edit-quotation" && selectedQuotation?.QuotationNumber
          ? selectedQuotation.QuotationNumber
          : "DRAFT-QUOTATION",
      LeadName: quotationForm.leadName || "Valued Lead / Customer",
      LeadAddress: quotationForm.leadAddress || "",
      Telephone: quotationForm.telephone || "",
      Email: quotationForm.email || "",
      FunctionDate: quotationForm.functionDate || null,
      FunctionType: quotationForm.functionType,
      ValidUntil: quotationForm.validUntil || null,
      Guests: guests,
      PlatePrice: calculatedPlatePrice,
      TotalPrice: totalSellingPrice,
      TotalCost: totalCost,
      ProfitAmount: profitAmount,
      ProfitPercentage: profitPercentage,
      CostPerPlate: costPerPlate,
      CostBreakdownJson: JSON.stringify(calculatedBreakdown),
      IncludeMenu: quotationForm.includeMenu,
      SelectedMenu: Array.isArray(quotationForm.selectedMenu) ? quotationForm.selectedMenu.join(",") : (quotationForm.selectedMenu || ""),
      SelectedDesserts: Array.isArray(quotationForm.selectedDesserts) ? quotationForm.selectedDesserts.join(",") : (quotationForm.selectedDesserts || ""),
      SelectedBites: Array.isArray(quotationForm.selectedBites) ? quotationForm.selectedBites.join(",") : (quotationForm.selectedBites || ""),
      SelectedPackages: Array.isArray(quotationForm.selectedPackages) ? quotationForm.selectedPackages.join(",") : (quotationForm.selectedPackages || ""),
      Notes: quotationForm.notes || "",
      Status: quotationForm.status || "Draft",
      CreatedAt: selectedQuotation?.CreatedAt || new Date().toISOString(),
      items: quotationForm.items
    };

    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl("");
    setPdfViewMode("sheet");
    setPreviewSheetMode("customer");
    setPreviewDoc({ type: "quotation", data: draftData, isDraft: true });
    setShowPdfPreview(true);
  };

  const handlePreviewInvoiceForm = () => {
    const { totalCost, profitAmount, profitPercentage, costPerPlate, totalSellingPrice, calculatedPlatePrice, calculatedBreakdown, guests } = costingCalculation;

    const draftData = {
      InvoiceId: selectedInvoice?.InvoiceId || null,
      InvoiceNumber:
        currentView === "edit" && selectedInvoice?.InvoiceNumber
          ? selectedInvoice.InvoiceNumber
          : "DRAFT-INVOICE",
      CustomerName: invoiceForm.customerName || "Valued Customer",
      CustomerAddress: invoiceForm.customerAddress || "",
      Telephone: invoiceForm.telephone || "",
      FunctionDate: invoiceForm.functionDate || null,
      FunctionType: invoiceForm.functionType,
      Guests: guests,
      PlatePrice: calculatedPlatePrice,
      TotalPrice: totalSellingPrice,
      TotalCost: totalCost,
      ProfitAmount: profitAmount,
      ProfitPercentage: profitPercentage,
      CostPerPlate: costPerPlate,
      CostBreakdownJson: JSON.stringify(calculatedBreakdown),
      IncludeMenu: invoiceForm.includeMenu,
      SelectedMenu: Array.isArray(invoiceForm.selectedMenu) ? invoiceForm.selectedMenu.join(",") : (invoiceForm.selectedMenu || ""),
      SelectedDesserts: Array.isArray(invoiceForm.selectedDesserts) ? invoiceForm.selectedDesserts.join(",") : (invoiceForm.selectedDesserts || ""),
      SelectedBites: Array.isArray(invoiceForm.selectedBites) ? invoiceForm.selectedBites.join(",") : (invoiceForm.selectedBites || ""),
      SelectedPackages: Array.isArray(invoiceForm.selectedPackages) ? invoiceForm.selectedPackages.join(",") : (invoiceForm.selectedPackages || ""),
      Notes: invoiceForm.notes || "",
      TotalPaid: selectedInvoice?.TotalPaid || 0,
      TotalBalance: totalSellingPrice - (selectedInvoice?.TotalPaid || 0),
      CreatedAt: selectedInvoice?.CreatedAt || new Date().toISOString(),
      items: invoiceForm.items,
      payments: selectedInvoice?.payments || []
    };

    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl("");
    setPdfViewMode("sheet");
    setPreviewSheetMode("customer");
    setPreviewDoc({ type: "invoice", data: draftData, isDraft: true });
    setShowPdfPreview(true);
  };

  const handleSwitchToEmbeddedPdf = async () => {
    setPdfViewMode("pdf");
    if (pdfBlobUrl) return;
    setPdfGenerating(true);
    setTimeout(async () => {
      try {
        const pdf = await buildPdfObjectFromElement("printable-invoice");
        if (pdf) {
          const blob = pdf.output("blob");
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to render embedded PDF");
      } finally {
        setPdfGenerating(false);
      }
    }, 200);
  };

  const handleDownloadFromPreview = async () => {
    if (!previewDoc) return;
    setPdfGenerating(true);
    setTimeout(async () => {
      try {
        const pdf = await buildPdfObjectFromElement("printable-invoice");
        if (!pdf) return;
        const isQuo = previewDoc.type === "quotation";
        const docNo = isQuo
          ? previewDoc.data.QuotationNumber || "Quotation"
          : previewDoc.data.InvoiceNumber || "Invoice";
        const name = isQuo ? previewDoc.data.LeadName : previewDoc.data.CustomerName;
        const safeName = (name || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
        const suffix = previewSheetMode === "costing" ? "_Costing_Sheet" : "";
        pdf.save(`${docNo}_${safeName}${suffix}.pdf`);
      } catch (err) {
        console.error(err);
        alert("Failed to generate PDF file");
      } finally {
        setPdfGenerating(false);
      }
    }, 150);
  };

  const handlePrintClick = async (inv) => {
    try {
      const res = await axios.get(`${API_BASE}/invoices/${inv.InvoiceId}`);
      setPreviewSheetMode("customer");
      setPreviewDoc({ type: "invoice", data: res.data, isDraft: false });
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve print data");
    }
  };

  const handlePrintQuotationClick = async (quo, mode = "customer") => {
    try {
      const res = await axios.get(`${API_BASE}/quotations/${quo.QuotationId}`);
      setPreviewSheetMode(mode);
      setPreviewDoc({ type: "quotation", data: res.data, isDraft: false });
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve quotation print data");
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.CustomerName.toLowerCase().includes(q) ||
      inv.InvoiceNumber.toLowerCase().includes(q) ||
      (inv.Telephone && inv.Telephone.includes(q))
    );
  });

  // Filtered quotations
  const filteredQuotations = quotations.filter((quo) => {
    const q = searchQuery.toLowerCase();
    return (
      quo.LeadName.toLowerCase().includes(q) ||
      quo.QuotationNumber.toLowerCase().includes(q) ||
      (quo.Telephone && quo.Telephone.includes(q)) ||
      (quo.Email && quo.Email.toLowerCase().includes(q))
    );
  });

  // Filtered Master Items
  const filteredMasterItems = masterItems.filter((item) => {
    const matchesCategory =
      masterCategoryFilter === "all" || item.Category === masterCategoryFilter;
    const matchesSearch =
      item.ItemName.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
      (item.Notes && item.Notes.toLowerCase().includes(masterSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // =========================================================================
  // DOCUMENT RENDERERS (CUSTOMER QUOTATION / INVOICE vs INTERNAL COSTING SHEET)
  // =========================================================================
  const renderDocumentContent = (docWrapper) => {
    if (!docWrapper || !docWrapper.data) return null;
    const isQuotation = docWrapper.type === "quotation";
    const doc = docWrapper.data;

    // IF INTERNAL COSTING SHEET MODE (EXCEL WEDDING PACKAGE SHEET FORMAT)
    if (previewSheetMode === "costing") {
      let breakdown = [];
      try {
        breakdown = doc.CostBreakdownJson ? JSON.parse(doc.CostBreakdownJson) : [];
      } catch {
        breakdown = [];
      }
      const guests = doc.Guests || 150;
      const bitesRatio = guests / 200;
      const refCode = isQuotation ? (doc.QuotationNumber || "DRAFT-QUOTATION") : (doc.InvoiceNumber || "DRAFT-INVOICE");
      const partyLabel = isQuotation ? "Lead: " : "Customer: ";
      const partyValue = isQuotation ? (doc.LeadName || "Valued Lead") : (doc.CustomerName || "Valued Customer");

      return (
        <>
          <div className="print-header">
            <div className="print-logo-circle">
              <ElegantLogo isPrint={true} />
            </div>
            <div className="print-title-area">
              <h1 className="print-main-title">Jayani Reception Hall</h1>
              <p className="print-subtitle">Internal Event Costing & Profit Sheet (Wedding Package)</p>
              <p className="print-contacts">Confidential • For Hotel Management Use Only</p>
            </div>
          </div>

          <div className="print-doc-banner" style={{ background: "#222" }}>
            <span className="print-doc-banner-title" style={{ color: "#f59e0b" }}>
              COSTING & PROFIT ANALYSIS
            </span>
            <div className="print-doc-banner-meta">
              <span>Ref: {refCode}</span>
              <span>{partyLabel}{partyValue}</span>
              <span>Guest Count: {guests}</span>
              <span>Bites Ratio: {bitesRatio.toFixed(2)} (x / 200)</span>
            </div>
          </div>

          <table className="internal-cost-table" style={{ width: "100%", borderCollapse: "collapse", color: "#111", margin: "1rem 0" }}>
            <thead>
              <tr style={{ background: "#f2f2f2", borderBottom: "2px solid #333", fontSize: "0.85rem" }}>
                <th style={{ textAlign: "left", padding: "6px" }}>Item Description</th>
                <th style={{ textAlign: "center", padding: "6px" }}>Category</th>
                <th style={{ textAlign: "center", padding: "6px" }}>Rule</th>
                <th style={{ textAlign: "center", padding: "6px" }}>Base Qty (200)</th>
                <th style={{ textAlign: "center", padding: "6px" }}>Calc Qty</th>
                <th style={{ textAlign: "center", padding: "6px" }}>Price Basis</th>
                <th style={{ textAlign: "right", padding: "6px" }}>Unit Rate (Rs.)</th>
                <th style={{ textAlign: "right", padding: "6px" }}>Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((it, idx) => {
                const isSelling = it.quotationPriceType === "selling";
                const unitRate = isSelling ? it.sellingPrice : (it.effectiveRate || it.costPrice);
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #ddd", fontSize: "0.82rem" }}>
                    <td style={{ padding: "5px 6px", fontWeight: "600" }}>{it.itemName}</td>
                    <td style={{ textAlign: "center", padding: "5px 6px", textTransform: "capitalize" }}>{it.category}</td>
                    <td style={{ textAlign: "center", padding: "5px 6px" }}>
                      {it.multiplierType === "per_guest" ? "Per Guest" : it.multiplierType === "fixed" ? "Fixed (1)" : "x / 200"}
                    </td>
                    <td style={{ textAlign: "center", padding: "5px 6px" }}>{it.baseQuantity} {it.unit}</td>
                    <td style={{ textAlign: "center", padding: "5px 6px", fontWeight: "700" }}>{it.calcQty} {it.unit}</td>
                    <td style={{ textAlign: "center", padding: "5px 6px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          background: isSelling ? "#d1fae5" : "#fef3c7",
                          color: isSelling ? "#065f46" : "#92400e"
                        }}
                      >
                        {isSelling ? "Selling Price" : "Cost Price"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", padding: "5px 6px" }}>{formatCurrency(unitRate)}</td>
                    <td style={{ textAlign: "right", padding: "5px 6px", fontWeight: "700" }}>{formatCurrency(it.totalCost)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #111", background: "#f9f9f9" }}>
                <td colSpan={7} style={{ padding: "8px 6px", fontWeight: "800", textTransform: "uppercase" }}>Total Event Cost:</td>
                <td style={{ textAlign: "right", padding: "8px 6px", fontWeight: "800", fontSize: "1rem" }}>Rs. {formatCurrency(doc.TotalCost)}</td>
              </tr>
              <tr style={{ background: "#f9f9f9" }}>
                <td colSpan={7} style={{ padding: "6px", fontWeight: "700" }}>Plate Cost (Cost / Guests):</td>
                <td style={{ textAlign: "right", padding: "6px", fontWeight: "700" }}>Rs. {formatCurrency(doc.CostPerPlate)}</td>
              </tr>
              <tr style={{ background: "#edf7ed" }}>
                <td colSpan={6} style={{ padding: "6px", fontWeight: "700", color: "#1e4620" }}>
                  Expected Profit ({doc.ProfitPercentage}%):
                </td>
                <td style={{ textAlign: "right", padding: "6px", fontWeight: "700", color: "#1e4620" }}>Rs. {formatCurrency(doc.ProfitAmount)}</td>
              </tr>
              <tr style={{ borderTop: "2px solid #111", background: "#fef9c3" }}>
                <td colSpan={6} style={{ padding: "8px 6px", fontWeight: "800", fontSize: "1rem", color: "#854d0e" }}>Total Quoted Selling Price:</td>
                <td style={{ textAlign: "right", padding: "8px 6px", fontWeight: "800", fontSize: "1.1rem", color: "#854d0e" }}>Rs. {formatCurrency(doc.TotalPrice)}</td>
              </tr>
              <tr style={{ background: "#fef9c3" }}>
                <td colSpan={6} style={{ padding: "6px", fontWeight: "800", color: "#854d0e" }}>Selling Price per Plate:</td>
                <td style={{ textAlign: "right", padding: "6px", fontWeight: "800", fontSize: "1.05rem", color: "#854d0e" }}>Rs. {formatCurrency(doc.PlatePrice)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ marginTop: "2rem", borderTop: "1px dashed #999", paddingTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#444" }}>
            <div>Calculated following Jayani Reception Hall Wedding Package model</div>
            <div>Prepared by Hotel Management • Date: {new Date().toLocaleDateString()}</div>
          </div>
        </>
      );
    }

    // STANDARD CUSTOMER QUOTATION / INVOICE VIEW
    const docNumber = isQuotation ? doc.QuotationNumber : doc.InvoiceNumber;
    const partyName = isQuotation ? doc.LeadName : doc.CustomerName;
    const partyAddress = isQuotation ? doc.LeadAddress : doc.CustomerAddress;

    return (
      <>
        {/* Watermark Logo Background */}
        <div className="invoice-watermark">
          Jayani
          <span>Reception Hall</span>
        </div>

        {/* Letterhead Header */}
        <div className="print-header">
          <div className="print-logo-circle">
            <ElegantLogo isPrint={true} />
          </div>
          <div className="print-title-area">
            <h1 className="print-main-title">Jayani Reception Hall</h1>
            <p className="print-subtitle">Maha Udawela , Wadumunnegedara</p>
            <p className="print-contacts">074 1 690 609 / 076 39 72 119</p>
          </div>
        </div>

        {/* Document Type & Number Banner */}
        <div className="print-doc-banner">
          <span className="print-doc-banner-title">
            {isQuotation ? "QUOTATION" : "INVOICE"}
          </span>
          <div className="print-doc-banner-meta">
            <span>{isQuotation ? "Quotation No:" : "Invoice No:"} {docNumber}</span>
            {doc.CreatedAt && <span>Date: {formatDate(doc.CreatedAt)}</span>}
            {isQuotation && doc.ValidUntil && (
              <span>Valid Until: {formatDate(doc.ValidUntil)}</span>
            )}
          </div>
        </div>

        {/* Primary Lead/Customer and Pricing Summary boxes */}
        <div className="print-meta-grid">
          <div className="print-meta-box">
            <h3 className="print-meta-title">
              {isQuotation ? "Lead / Customer Info" : "Customer Info"}
            </h3>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "700", padding: "0.18rem 0", width: "95px", verticalAlign: "top" }}>
                    Name:
                  </td>
                  <td style={{ padding: "0.18rem 0" }}>{partyName}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700", padding: "0.18rem 0", verticalAlign: "top" }}>
                    Address:
                  </td>
                  <td style={{ padding: "0.18rem 0", whiteSpace: "pre-wrap" }}>
                    {partyAddress || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700", padding: "0.18rem 0", verticalAlign: "top" }}>
                    Telephone:
                  </td>
                  <td style={{ padding: "0.18rem 0" }}>{doc.Telephone || "N/A"}</td>
                </tr>
                {isQuotation && doc.Email && (
                  <tr>
                    <td style={{ fontWeight: "700", padding: "0.18rem 0", verticalAlign: "top" }}>
                      Email:
                    </td>
                    <td style={{ padding: "0.18rem 0" }}>{doc.Email}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="print-meta-box highlight">
            <h3 className="print-meta-title">
              {isQuotation ? "Event & Quotation Summary" : "Event & Pricing Summary"}
            </h3>
            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "700", padding: "0.18rem 0", width: "130px" }}>
                    Function Type:
                  </td>
                  <td>
                    {doc.FunctionType && doc.FunctionType.includes("Wedding")
                      ? doc.FunctionType.split(":").pop() || "Day function"
                      : doc.FunctionType}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700", padding: "0.18rem 0" }}>Function Date:</td>
                  <td>{doc.FunctionDate ? formatDate(doc.FunctionDate) : "TBD / Not Specified"}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "700", padding: "0.18rem 0" }}>Guest Count:</td>
                  <td>{doc.Guests}</td>
                </tr>
                <tr style={{ borderTop: "1px dashed #ccc" }}>
                  <td style={{ fontWeight: "700", padding: "0.25rem 0" }}>Plate Price:</td>
                  <td style={{ fontWeight: "700" }}>Rs. {formatCurrency(doc.PlatePrice)}</td>
                </tr>
                <tr style={{ borderTop: "1.5px solid #222" }}>
                  <td style={{ fontWeight: "800", padding: "0.28rem 0" }}>
                    {isQuotation ? "Total Quoted:" : "Total Price:"}
                  </td>
                  <td style={{ fontWeight: "800", fontSize: "0.98rem" }}>
                    Rs. {formatCurrency(doc.TotalPrice)}
                  </td>
                </tr>
                {!isQuotation && (
                  <>
                    <tr>
                      <td style={{ fontWeight: "700", padding: "0.18rem 0", color: "#2e7d32" }}>
                        Total Paid:
                      </td>
                      <td style={{ fontWeight: "700", color: "#2e7d32" }}>
                        Rs. {formatCurrency(doc.TotalPaid)}
                      </td>
                    </tr>
                    <tr style={{ borderTop: "1.5px solid #222" }}>
                      <td style={{ fontWeight: "800", padding: "0.28rem 0", color: "#c62828" }}>
                        Balance Due:
                      </td>
                      <td style={{ fontWeight: "800", fontSize: "1rem", color: "#c62828" }}>
                        Rs. {formatCurrency(doc.TotalBalance)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Menu & Package Inclusions */}
        {doc.IncludeMenu &&
          (() => {
            // Extract items from doc.CostBreakdownJson if present, fallback to Selected* fields
            let breakdownPlanned = null;
            if (doc.CostBreakdownJson) {
              try {
                breakdownPlanned = typeof doc.CostBreakdownJson === "string" ? JSON.parse(doc.CostBreakdownJson) : doc.CostBreakdownJson;
              } catch {
                breakdownPlanned = null;
              }
            }

            // 1. Packages: strictly customer-facing (excluding all staff/operations)
            const plannedPackages = Array.isArray(breakdownPlanned)
              ? breakdownPlanned
                .filter((it) => it.selected && (it.category === "package" || it.Category === "package") && !isStaffOrOperationItem(it))
                .map((it) => it.itemName || it.ItemName)
              : [];
            const formPackages = doc.SelectedPackages
              ? doc.SelectedPackages.split(",").map((i) => i.trim()).filter((i) => Boolean(i) && !isStaffOrOperationItemName(i))
              : [];
            const packageItems = Array.from(new Set([...plannedPackages, ...formPackages]));
            const hasPackages = packageItems.length > 0;

            // 2. Bites: strictly customer-facing (excluding all staff/operations)
            const plannedBites = Array.isArray(breakdownPlanned)
              ? breakdownPlanned
                .filter((it) => it.selected && (it.category === "bites" || it.Category === "bites") && !isStaffOrOperationItem(it))
                .map((it) => it.itemName || it.ItemName)
              : [];
            const formBites = doc.SelectedBites
              ? doc.SelectedBites.split(",").map((i) => i.trim()).filter((i) => Boolean(i) && !isStaffOrOperationItemName(i))
              : [];
            const bitesItems = Array.from(new Set([...plannedBites, ...formBites]));
            const hasBites = bitesItems.length > 0;

            // 3. Desserts: shown separately, strictly excluding all staff/operations
            const plannedDesserts = Array.isArray(breakdownPlanned)
              ? breakdownPlanned
                .filter((it) => it.selected && (it.category === "dessert" || it.Category === "dessert") && !isStaffOrOperationItem(it))
                .map((it) => it.itemName || it.ItemName)
              : [];
            const formDesserts = doc.SelectedDesserts
              ? doc.SelectedDesserts.split(",").map((i) => i.trim()).filter((i) => Boolean(i) && !isStaffOrOperationItemName(i))
              : (doc.SelectedMenu
                ? doc.SelectedMenu.split(",").map((i) => i.trim()).filter((i) => DESSERT_OPTIONS.includes(i) && !isStaffOrOperationItemName(i))
                : []);
            const dessertItems = Array.from(new Set([...plannedDesserts, ...formDesserts]));
            const hasDesserts = dessertItems.length > 0;

            // 4. Buffet & Welcome Drinks: strictly excluding desserts and staff/operations
            const plannedBuffet = Array.isArray(breakdownPlanned)
              ? breakdownPlanned
                .filter((it) => it.selected && (it.category === "buffet" || it.Category === "buffet") && !isStaffOrOperationItem(it))
                .map((it) => it.itemName || it.ItemName)
              : [];
            const formMenu = doc.SelectedMenu
              ? doc.SelectedMenu.split(",").map((i) => i.trim()).filter((i) => Boolean(i) && !isStaffOrOperationItemName(i))
              : [];
            const allBuffetRaw = Array.from(new Set([...plannedBuffet, ...formMenu])).filter(
              (name) => !dessertItems.includes(name) && !DESSERT_OPTIONS.includes(name) && !isStaffOrOperationItemName(name)
            );
            const welcomeDrinks = allBuffetRaw.filter(
              (i) => WELCOME_DRINK_OPTIONS.includes(i) || i.toLowerCase().includes("drink") || i.toLowerCase().includes("බීම")
            );
            const buffetItems = allBuffetRaw.filter((i) => !welcomeDrinks.includes(i));
            const hasBuffet = welcomeDrinks.length > 0 || buffetItems.length > 0;
            const gridCols = (hasBites || hasDesserts) && hasBuffet ? "1.2fr 0.8fr" : "1fr";

            return (
              <>
                {/* 1. Package Details & Services */}
                {hasPackages && (
                  <div className="print-menu-box no-break">
                    <h3 className="print-menu-title">Package Details & Services</h3>
                    <div
                      className="print-menu-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        columnGap: "1.5rem",
                        rowGap: "0.25rem"
                      }}
                    >
                      {packageItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="print-menu-item"
                          style={{ fontSize: "0.82rem", fontWeight: "600", color: "#333" }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Buffet Menu, Bites & Dessert Inclusions */}
                {(hasBuffet || hasBites || hasDesserts) && (
                  <div className="print-menu-box no-break">
                    <h3 className="print-menu-title">Buffet Menu, Bites & Dessert Inclusions</h3>
                    <div style={{ display: "grid", gridTemplateColumns: gridCols, columnGap: "1.5rem" }}>
                      {hasBuffet && (
                        <div>
                          {welcomeDrinks.length > 0 && (
                            <div style={{ marginBottom: "0.75rem" }}>
                              <h4
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "700",
                                  borderBottom: "1px dashed #bbb",
                                  paddingBottom: "0.2rem",
                                  marginBottom: "0.4rem",
                                  color: "#111"
                                }}
                              >
                                Welcome Drinks
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                {welcomeDrinks.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="print-menu-item"
                                    style={{ fontSize: "0.82rem", fontWeight: "600", color: "#333" }}
                                  >
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {buffetItems.length > 0 && (
                            <div>
                              <h4
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "700",
                                  borderBottom: "1px dashed #bbb",
                                  paddingBottom: "0.2rem",
                                  marginBottom: "0.4rem",
                                  color: "#111"
                                }}
                              >
                                Buffet Items
                              </h4>
                              <div
                                className="print-menu-grid"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: hasBites || hasDesserts ? "1fr" : "1fr 1fr",
                                  columnGap: "1rem",
                                  rowGap: "0.2rem"
                                }}
                              >
                                {buffetItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="print-menu-item"
                                    style={{ fontSize: "0.82rem", fontWeight: "600", color: "#333" }}
                                  >
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {(hasBites || hasDesserts) && (
                        <div>
                          {hasBites && (
                            <div style={{ marginBottom: hasDesserts ? "0.85rem" : "0" }}>
                              <h4
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "700",
                                  borderBottom: "1px dashed #bbb",
                                  paddingBottom: "0.2rem",
                                  marginBottom: "0.5rem",
                                  color: "#111"
                                }}
                              >
                                Bites Inclusions
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                {bitesItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="print-menu-item"
                                    style={{ fontSize: "0.82rem", fontWeight: "600", color: "#333" }}
                                  >
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {hasDesserts && (
                            <div>
                              <h4
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "700",
                                  borderBottom: "1px dashed #bbb",
                                  paddingBottom: "0.2rem",
                                  marginBottom: "0.5rem",
                                  color: "#111",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.35rem"
                                }}
                              >
                                <span>🍨 Dessert Inclusions (අතුරුපස)</span>
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                {dessertItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="print-menu-item"
                                    style={{ fontSize: "0.82rem", fontWeight: "600", color: "#333", display: "flex", alignItems: "center", gap: "0.35rem" }}
                                  >
                                    <span style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}>✦</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

        {/* Notes */}
        {doc.Notes && doc.Notes.trim().length > 0 && (
          <>
            <hr className="print-hr" />
            <div className="print-payment-section no-break">
              <h3 className="print-payment-title">Special Notes & Remarks</h3>
              <div style={{ fontSize: "0.9rem", color: "#222", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {doc.Notes}
              </div>
            </div>
          </>
        )}

        {/* Payments list for Invoice */}
        {!isQuotation && (
          <>
            <hr className="print-hr" />
            <div className="print-payment-section">
              <h3 className="print-payment-title">Payment Details</h3>
              {!doc.payments || doc.payments.length === 0 ? (
                <div style={{ fontSize: "0.95rem", color: "#555" }}>No payments recorded.</div>
              ) : (
                doc.payments.map((p) => {
                  const pDate = new Date(p.PaymentDate);
                  const day = String(pDate.getDate()).padStart(2, "0");
                  const month = String(pDate.getMonth() + 1).padStart(2, "0");
                  const year = pDate.getFullYear();
                  const formattedDateStr = `${day}/${month}/${year}`;

                  return (
                    <div key={p.PaymentId} className="print-payment-row">
                      <div>{formattedDateStr}</div>
                      <div style={{ paddingLeft: "1.5rem" }}>{p.Description}</div>
                      <div className="text-right" style={{ fontWeight: "700" }}>
                        {formatCurrency(p.Amount)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Terms & Conditions */}
        <div className="print-terms-section no-break">
          <div className="print-terms-title">Terms & Conditions</div>
          <ul>
            <li>No refund will be provided for any payments made.</li>
            <li>Prices are subject to change based on the final number of guests.</li>
            <li>The customer must pay 75% of the total amount at least 10 days before the wedding date.</li>
            <li>The remaining balance must be paid before the end of the function.</li>
            <li>The customer is responsible for paying the cost of any damage caused to the hall, furniture, decorations, equipment, or any other property during the event.</li>
            <li>The customer must ensure that all guests comply with the hall rules and regulations.</li>
            <li>The management is not responsible for the loss, theft, or damage of personal belongings during the event.</li>
            <li>Outside food, beverages, decorations, or entertainment equipment are not permitted unless prior approval has been obtained from the management.</li>
            <li>Any additional services or changes requested after the booking confirmation may be subject to additional charges.</li>
            <li>The management reserves the right to refuse any activity that may disturb other guests, violate the law, or cause damage to the premises.</li>
            <li>The customer is responsible for obtaining any permits or licenses required for special entertainment performances.</li>
            <li>Smoking is prohibited inside the reception hall unless otherwise permitted in designated areas.</li>
            <li>Illegal activities, dangerous items, fireworks, or hazardous materials are strictly prohibited within the premises.</li>
            <li>Day functions must conclude by 4:00 PM; Day buffet service will close at 3:45 PM.</li>
            <li>Night functions will be held from 6:00 PM to 12:00 Midnight; Night buffet service will close at 11:45 PM.</li>
            <li>Overtime usage of the hall, if approved by the management, will be subject to additional charges.</li>
            <li>The customer must return all rented items in good condition before leaving the premises.</li>
            <li>The management reserves the right to amend these terms and conditions when necessary without prior notice.</li>
          </ul>
        </div>

        {/* Signature lines */}
        <div className="print-signature-row no-break">
          <div className="signature-box">
            <div className="signature-line"></div>
            <span>Customer's Signature</span>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <span>Authorized Signature</span>
          </div>
        </div>
      </>
    );
  };

  // =========================================================================
  // WEDDING PACKAGE COST & PROFIT PLANNER SECTION (SHARED QUOTATION & INVOICE)
  // =========================================================================
  const renderWeddingPackagePlannerSection = (isInvoice = false) => {
    const form = isInvoice ? invoiceForm : quotationForm;
    const docTypeLabel = isInvoice ? "Invoice" : "Quotation";
    const clientTypeLabel = isInvoice ? "Client" : "Lead";
    const totalLabel = isInvoice ? "Total Invoiced (H33)" : "Total Quoted (H33)";
    const totalSub = isInvoice ? "Total revenue from client (Cost + Profit)" : "Total revenue to lead (Cost + Profit)";
    const summaryTitle = isInvoice ? "Total Invoiced to Client:" : "Total Quoted to Client:";

    return (
      <>
        {/* =========================================================================
           WEDDING PACKAGE COST & PROFIT PLANNER (HOTELRATES SHEET REPLICA)
           ========================================================================= */}
        <div className="cost-calculator-card">
          <div className="cost-calculator-header">
            <div className="cost-calculator-title">
              <FileSpreadsheet size={22} />
              <span>Wedding Package Cost & Profit Engine</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: "700" }}>Guest Count (C2):</label>
                <input
                  type="number"
                  min="1"
                  value={form.guests}
                  onChange={(e) => handleGuestsChange(e.target.value)}
                  style={{ width: "95px", fontWeight: "700", textAlign: "center", padding: "0.4rem" }}
                />
              </div>
              <span className="multiplier-pill" style={{ background: "rgba(212,175,55,0.15)", color: "var(--color-primary)", fontWeight: "600" }}>
                Bites Ratio (D2 = Guests / 200): {(costingCalculation.bitesRatio).toFixed(2)}
              </span>
            </div>
          </div>

          {/* LIVE 3-WAY INTERACTIVE SUMMARY CARDS (EXCEL ROWS 30-34 REPLICA) */}
          <div className="cost-summary-grid">
            {/* 1. TOTAL COST (H30) */}
            <div className="cost-summary-box highlight-cost">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="cost-summary-label">Total Cost (H30)</span>
                <span className="badge" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                  Auto Cost
                </span>
              </div>
              <div style={{ padding: "0.35rem 0", fontSize: "1.35rem", fontWeight: "700", color: "#f59e0b" }}>
                Rs. {formatCurrency(costingCalculation.totalCost)}
              </div>
              <span className="cost-summary-sub">Plate Cost: Rs. {formatCurrency(costingCalculation.costPerPlate)}</span>
            </div>

            {/* 2. EXPECTED PROFIT (H32) - EDITABLE */}
            <div className={`cost-summary-box highlight-profit ${form.profitMode === "fixed" ? "active-border" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="cost-summary-label" style={{ color: "var(--color-success)" }}>Expected Profit (H32)</span>
                {(form.profitMode === "fixed" || form.profitMode === "percent") && (
                  <span className="badge" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(16, 185, 129, 0.2)", color: "#34d399" }}>
                    {form.profitMode === "percent" ? `${costingCalculation.profitPercentage}% Margin` : "Active Driver"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                <span style={{ color: "#34d399", fontWeight: "700", fontSize: "1rem" }}>Rs.</span>
                <input
                  type="number"
                  step="100"
                  className="cost-summary-input profit"
                  placeholder="0"
                  value={form.profitMode === "fixed" ? (form.fixedProfitAmount ?? "") : costingCalculation.profitAmount}
                  onChange={(e) => handleProfitAmountChange(e.target.value)}
                  title="Edit Expected Profit in Rupees to recalculate Total and Plate Price"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem", flexWrap: "wrap", fontSize: "0.76rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Margin:</span>
                <input
                  type="number"
                  step="0.5"
                  style={{
                    width: "55px",
                    padding: "0.15rem 0.3rem",
                    fontSize: "0.78rem",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    color: "#34d399",
                    fontWeight: "700"
                  }}
                  value={form.profitMode === "percent" ? (form.profitPercentage ?? "") : costingCalculation.profitPercentage}
                  onChange={(e) => handleProfitPercentageChange(e.target.value)}
                  title="Set Margin % on cost"
                />
                <span style={{ color: "var(--color-text-muted)" }}>%</span>
                <div style={{ display: "flex", gap: "0.2rem", marginLeft: "auto" }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: "0.1rem 0.35rem", fontSize: "0.68rem" }} onClick={() => handleProfitPercentageChange(20)}>20%</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: "0.1rem 0.35rem", fontSize: "0.68rem" }} onClick={() => handleProfitPercentageChange(25)}>25%</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: "0.1rem 0.35rem", fontSize: "0.68rem" }} onClick={() => handleProfitPercentageChange(30)}>30%</button>
                </div>
              </div>
            </div>

            {/* 3. TOTAL QUOTED / INVOICED (H33) - EDITABLE */}
            <div className={`cost-summary-box highlight-total ${form.profitMode === "total_quoted" ? "active-border" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="cost-summary-label" style={{ color: "var(--color-primary)" }}>{totalLabel}</span>
                {form.profitMode === "total_quoted" && (
                  <span className="badge" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(212,175,55,0.2)", color: "var(--color-primary)" }}>
                    Active Driver
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                <span style={{ color: "var(--color-primary)", fontWeight: "700", fontSize: "1rem" }}>Rs.</span>
                <input
                  type="number"
                  step="500"
                  className="cost-summary-input total"
                  placeholder="0"
                  value={form.profitMode === "total_quoted" ? (form.totalQuotedAmount ?? "") : costingCalculation.totalSellingPrice}
                  onChange={(e) => handleTotalQuotedChange(e.target.value)}
                  title={`Edit ${totalLabel} package value to recalculate Profit and Plate Price`}
                />
              </div>
              <span className="cost-summary-sub" style={{ marginTop: "0.35rem" }}>{totalSub}</span>
            </div>

            {/* 4. PLATE PRICE (H34) - EDITABLE */}
            <div className="cost-summary-box" style={{ border: (form.profitMode === "target_plate" || form.profitMode === "plate_price") ? "2px solid var(--color-primary)" : "1px solid var(--border-color)", background: "rgba(212,175,55,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="cost-summary-label" style={{ color: "var(--color-primary)" }}>Plate Price (H34)</span>
                {(form.profitMode === "target_plate" || form.profitMode === "plate_price") && (
                  <span className="badge" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", background: "rgba(212,175,55,0.2)", color: "var(--color-primary)" }}>
                    Active Driver
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem" }}>
                <span style={{ color: "var(--color-primary)", fontWeight: "700", fontSize: "1rem" }}>Rs.</span>
                <input
                  type="number"
                  step="25"
                  className="cost-summary-input plate"
                  placeholder="0"
                  value={(form.profitMode === "target_plate" || form.profitMode === "plate_price") ? (form.targetPlatePrice ?? "") : costingCalculation.calculatedPlatePrice}
                  onChange={(e) => handlePlatePriceChange(e.target.value)}
                  title="Edit Plate Selling Price per guest to recalculate Total and Profit"
                />
              </div>
              <span className="cost-summary-sub" style={{ marginTop: "0.35rem" }}>Selling per guest ({form.guests} guests)</span>
            </div>
          </div>

          {/* LIVE CALCULATION TIP & SYNC CONTROLS */}
          <div style={{ background: "rgba(0,0,0,0.25)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sliders size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              <span><strong>Interactive 3-Way Engine:</strong> Changing <em>Expected Profit</em>, <em>Total Value</em>, or <em>Plate Price</em> automatically recalculates all other figures and updates your {docTypeLabel.toLowerCase()} in real time!</span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSyncPlannerToLineItems(isInvoice)}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Check size={15} /> Sync Package Description
            </button>
          </div>

          {/* BATCH PRICE BASIS SELECTOR (COST VS SELLING) */}
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem 1rem", borderRadius: "6px", border: "1px solid var(--border-color)", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)" }}>
                Pricing Rate Basis:
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                (Switch whether items calculate using Cost Price or Selling Price)
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem" }}
                onClick={() => handleSetAllPlannedPriceType("master")}
              >
                Use Master Defaults
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", borderColor: "#f59e0b", color: "#f59e0b" }}
                onClick={() => handleSetAllPlannedPriceType("cost")}
              >
                All Cost Prices
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.78rem", borderColor: "#10b981", color: "#10b981" }}
                onClick={() => handleSetAllPlannedPriceType("selling")}
              >
                All Selling Prices
              </button>
            </div>
          </div>

          {/* SELECTABLE ITEMS ORGANIZED BY CATEGORY */}
          <div style={{ marginBottom: "1rem" }}>
            <h4 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "1rem" }}>
              1. Select Bites (Defaults set for 200 Guests — Auto-scaled to {form.guests} Guests)
            </h4>
            <div className="item-catalog-grid">
              {masterItems.filter(i => i.Category === "bites").map((item) => {
                const plannedItem = form.plannedItems?.find(p => p.itemId === item.ItemId);
                const isSelected = plannedItem ? plannedItem.selected : false;
                const rawQty = item.BaseQuantity * (form.guests / 200);
                const calcQty = isStaffOrDiscreteItem(item) ? Math.ceil(rawQty) : parseFloat(rawQty.toFixed(1));
                const priceBasis = (plannedItem?.quotationPriceType || item.QuotationPriceType) === "selling" ? "selling" : "cost";
                const activeRate = priceBasis === "selling" ? item.SellingPrice : item.CostPrice;
                const cost = (calcQty * activeRate).toFixed(0);

                return (
                  <div
                    key={item.ItemId}
                    className={`item-check-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleTogglePlannedItem(item.ItemId)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      style={{ width: "16px", height: "16px", marginTop: "3px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <div className="item-check-title">{item.ItemName}</div>
                        <button
                          type="button"
                          style={{
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: priceBasis === "selling" ? "#10b981" : "#f59e0b",
                            background: priceBasis === "selling" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: priceBasis === "selling" ? "#34d399" : "#fbbf24",
                            fontSize: "0.68rem",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "3px",
                            fontWeight: "700"
                          }}
                          onClick={(e) => handleTogglePlannedItemPriceType(item.ItemId, e)}
                          title="Click to toggle between Cost Price and Selling Price for this item"
                        >
                          {priceBasis === "selling" ? "Selling" : "Cost"} ⇄
                        </button>
                      </div>
                      <div className="item-check-meta">
                        <span>Base: {item.BaseQuantity} {item.Unit} (200)</span>
                        <span style={{ color: "var(--color-primary)", fontWeight: "700" }}>Qty: {calcQty} {item.Unit}</span>
                        <span style={{ color: priceBasis === "selling" ? "#34d399" : "#f59e0b" }}>
                          Rs. {formatCurrency(cost)} (@{formatCurrency(activeRate)})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <h4 style={{ color: "var(--color-primary)", marginTop: "1rem", marginBottom: "0.75rem", fontSize: "1rem" }}>
              2. Select Package Details & Services (Multiplied ONLY ONE)
            </h4>
            <div className="item-catalog-grid">
              {masterItems.filter(i => i.Category === "package").map((item) => {
                const plannedItem = form.plannedItems?.find(p => p.itemId === item.ItemId);
                const isSelected = plannedItem ? plannedItem.selected : false;
                const priceBasis = (plannedItem?.quotationPriceType || item.QuotationPriceType) === "selling" ? "selling" : "cost";
                const activeRate = priceBasis === "selling" ? item.SellingPrice : item.CostPrice;

                return (
                  <div
                    key={item.ItemId}
                    className={`item-check-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleTogglePlannedItem(item.ItemId)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      style={{ width: "16px", height: "16px", marginTop: "3px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <div className="item-check-title">{item.ItemName}</div>
                        <button
                          type="button"
                          style={{
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: priceBasis === "selling" ? "#10b981" : "#f59e0b",
                            background: priceBasis === "selling" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: priceBasis === "selling" ? "#34d399" : "#fbbf24",
                            fontSize: "0.68rem",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "3px",
                            fontWeight: "700"
                          }}
                          onClick={(e) => handleTogglePlannedItemPriceType(item.ItemId, e)}
                          title="Click to toggle between Cost Price and Selling Price for this item"
                        >
                          {priceBasis === "selling" ? "Selling" : "Cost"} ⇄
                        </button>
                      </div>
                      <div className="item-check-meta">
                        <span style={{ color: priceBasis === "selling" ? "#34d399" : "#f59e0b" }}>
                          Rs. {formatCurrency(activeRate)} ({priceBasis === "selling" ? "Selling" : "Cost"} x 1)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. BUFFET ITEMS */}
            <h4 style={{ color: "var(--color-primary)", marginTop: "1rem", marginBottom: "0.75rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Utensils size={18} /> 3. Select Buffet Menus & Items (Multiplied by Guest Count: {form.guests})
            </h4>
            <div className="item-catalog-grid">
              {masterItems.filter((i) => i.Category === "buffet").map((item) => {
                const plannedItem = form.plannedItems?.find((p) => p.itemId === item.ItemId);
                const isSelected = plannedItem ? plannedItem.selected : false;
                const priceBasis = (plannedItem?.quotationPriceType || item.QuotationPriceType) === "selling" ? "selling" : "cost";
                const activeRate = priceBasis === "selling" ? item.SellingPrice : item.CostPrice;
                const cost = (form.guests * activeRate).toFixed(0);

                return (
                  <div
                    key={item.ItemId}
                    className={`item-check-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleTogglePlannedItem(item.ItemId)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      style={{ width: "16px", height: "16px", marginTop: "3px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <div className="item-check-title">{item.ItemName}</div>
                        <button
                          type="button"
                          style={{
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: priceBasis === "selling" ? "#10b981" : "#f59e0b",
                            background: priceBasis === "selling" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: priceBasis === "selling" ? "#34d399" : "#fbbf24",
                            fontSize: "0.68rem",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "3px",
                            fontWeight: "700"
                          }}
                          onClick={(e) => handleTogglePlannedItemPriceType(item.ItemId, e)}
                          title="Click to toggle between Cost Price and Selling Price for this item"
                        >
                          {priceBasis === "selling" ? "Selling" : "Cost"} ⇄
                        </button>
                      </div>
                      <div className="item-check-meta">
                        <span>{item.Category}</span>
                        <span style={{ color: priceBasis === "selling" ? "#34d399" : "#f59e0b" }}>
                          Rs. {formatCurrency(activeRate)}/guest
                        </span>
                        <span style={{ color: "var(--color-primary)", fontWeight: "700" }}>Total: Rs. {formatCurrency(cost)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. DESSERT ITEMS SHOWN SEPARATELY */}
            <div style={{ marginTop: "1.25rem", padding: "0.85rem", borderRadius: "8px", background: "rgba(236, 72, 153, 0.05)", border: "1px dashed rgba(236, 72, 153, 0.4)" }}>
              <h4 style={{ color: "#f472b6", marginBottom: "0.75rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Coffee size={18} /> 🍨 4. Select Dessert Items (Shown Separately — Multiplied by Guest Count: {form.guests})
              </h4>
              <div className="item-catalog-grid">
                {masterItems.filter((i) => i.Category === "dessert").map((item) => {
                  const plannedItem = form.plannedItems?.find((p) => p.itemId === item.ItemId);
                  const isSelected = plannedItem ? plannedItem.selected : false;
                  const priceBasis = (plannedItem?.quotationPriceType || item.QuotationPriceType) === "selling" ? "selling" : "cost";
                  const activeRate = priceBasis === "selling" ? item.SellingPrice : item.CostPrice;
                  const cost = (form.guests * activeRate).toFixed(0);

                  return (
                    <div
                      key={item.ItemId}
                      className={`item-check-card ${isSelected ? "selected" : ""}`}
                      style={isSelected ? { borderColor: "#f472b6", background: "rgba(236, 72, 153, 0.15)" } : {}}
                      onClick={() => handleTogglePlannedItem(item.ItemId)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        style={{ width: "16px", height: "16px", marginTop: "3px", accentColor: "#ec4899" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                          <div className="item-check-title" style={isSelected ? { color: "#fbcfe8" } : {}}>{item.ItemName}</div>
                          <button
                            type="button"
                            style={{
                              cursor: "pointer",
                              border: "1px solid",
                              borderColor: priceBasis === "selling" ? "#10b981" : "#f472b6",
                              background: priceBasis === "selling" ? "rgba(16, 185, 129, 0.2)" : "rgba(236, 72, 153, 0.2)",
                              color: priceBasis === "selling" ? "#34d399" : "#fbcfe8",
                              fontSize: "0.68rem",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "3px",
                              fontWeight: "700"
                            }}
                            onClick={(e) => handleTogglePlannedItemPriceType(item.ItemId, e)}
                            title="Click to toggle between Cost Price and Selling Price for this item"
                          >
                            {priceBasis === "selling" ? "Selling" : "Cost"} ⇄
                          </button>
                        </div>
                        <div className="item-check-meta">
                          <span style={{ color: "#f472b6", fontWeight: "600" }}>Dessert</span>
                          <span style={{ color: priceBasis === "selling" ? "#34d399" : "#f59e0b" }}>
                            Rs. {formatCurrency(activeRate)}/guest
                          </span>
                          <span style={{ color: "#ec4899", fontWeight: "700" }}>Total: Rs. {formatCurrency(cost)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. STAFF & OPERATIONS COSTS (INTERNAL ONLY) */}
            <h4 style={{ color: "var(--color-primary)", marginTop: "1rem", marginBottom: "0.75rem", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <span>5. Staff & Operations Costs (Internal Costing Only)</span>
              <span style={{ fontSize: "0.75rem", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.2rem 0.55rem", borderRadius: "12px", fontWeight: "normal" }}>
                🔒 Excluded from Customer {docTypeLabel}
              </span>
            </h4>
            <div className="item-catalog-grid">
              {masterItems.filter(i => i.Category === "operations").map((item) => {
                const plannedItem = form.plannedItems?.find(p => p.itemId === item.ItemId);
                const isSelected = plannedItem ? plannedItem.selected : false;
                const rawQty = item.MultiplierType === "staff_200"
                  ? (item.BaseQuantity * (form.guests / 200))
                  : item.BaseQuantity;
                const calcQty = isStaffOrDiscreteItem(item) ? Math.ceil(rawQty) : parseFloat(rawQty.toFixed(1));
                const priceBasis = (plannedItem?.quotationPriceType || item.QuotationPriceType) === "selling" ? "selling" : "cost";
                const activeRate = priceBasis === "selling" ? item.SellingPrice : item.CostPrice;
                const cost = (calcQty * activeRate).toFixed(0);

                return (
                  <div
                    key={item.ItemId}
                    className={`item-check-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleTogglePlannedItem(item.ItemId)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      style={{ width: "16px", height: "16px", marginTop: "3px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <div className="item-check-title">{item.ItemName}</div>
                        <button
                          type="button"
                          style={{
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: priceBasis === "selling" ? "#10b981" : "#f59e0b",
                            background: priceBasis === "selling" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: priceBasis === "selling" ? "#34d399" : "#fbbf24",
                            fontSize: "0.68rem",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "3px",
                            fontWeight: "700"
                          }}
                          onClick={(e) => handleTogglePlannedItemPriceType(item.ItemId, e)}
                          title="Click to toggle between Cost Price and Selling Price for this item"
                        >
                          {priceBasis === "selling" ? "Selling" : "Cost"} ⇄
                        </button>
                      </div>
                      <div className="item-check-meta">
                        <span>Qty: {calcQty} {item.Unit}</span>
                        <span style={{ color: priceBasis === "selling" ? "#34d399" : "#f59e0b" }}>
                          Cost: Rs. {formatCurrency(cost)} (@{formatCurrency(activeRate)})
                        </span>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.72rem" }}>• Internal only</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer Line Items Editor */}
        <div className="form-group full-width" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <label style={{ fontSize: "1.1rem", color: "var(--color-primary)", fontWeight: "600" }}>
              Customer {docTypeLabel} Package (Bill Details for Client)
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setActiveDocForm((prev) => ({
                  ...prev,
                  items: [...prev.items, { description: "", quantity: 1, unitPrice: 0 }]
                }))
              }
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
            >
              <Plus size={14} /> Add Custom Line Item
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {form.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  background: "rgba(0,0,0,0.15)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ flex: 1, minWidth: "250px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Package Description for Client</label>
                  <textarea
                    rows={3}
                    value={item.description}
                    required
                    onChange={(e) => {
                      setActiveDocForm((prev) => {
                        const newItems = [...prev.items];
                        newItems[index] = { ...newItems[index], description: e.target.value };
                        return { ...prev, items: newItems };
                      });
                    }}
                  />
                </div>
                <div style={{ width: "100px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => {
                      setActiveDocForm((prev) => {
                        const newItems = [...prev.items];
                        newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value) || 0 };
                        return { ...prev, items: newItems };
                      });
                    }}
                  />
                </div>
                <div style={{ width: "120px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Plate / Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) => {
                      setActiveDocForm((prev) => {
                        const newItems = [...prev.items];
                        newItems[index] = { ...newItems[index], unitPrice: parseFloat(e.target.value) || 0 };
                        return { ...prev, items: newItems };
                      });
                    }}
                  />
                </div>
                <div style={{ width: "120px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total</label>
                  <div style={{ padding: "0.75rem 0", fontWeight: "600", color: "var(--color-primary)" }}>
                    Rs. {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                </div>
                <button
                  type="button"
                  className="action-btn delete"
                  disabled={form.items.length <= 1}
                  onClick={() => {
                    setActiveDocForm((prev) => {
                      const newItems = prev.items.filter((_, idx) => idx !== index);
                      return { ...prev, items: newItems };
                    });
                  }}
                  style={{ marginTop: "1.75rem" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Special Notes */}
        <div className="form-group full-width" style={{ marginTop: "1rem" }}>
          <label>Special Notes / Remarks for {clientTypeLabel} (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. Complimentary welcome drink included. Special discount applied for 150+ guests."
            value={form.notes || ""}
            onChange={(e) => setActiveDocForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {/* Quoted / Invoiced Total Summary */}
        <div
          style={{
            background: "rgba(0,0,0,0.2)",
            padding: "1.25rem 1.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1.5rem 0"
          }}
        >
          <div>
            <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", display: "block" }}>{summaryTitle}</span>
            <span style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--color-primary)" }}>
              Rs. {formatCurrency(form.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0))}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "block" }}>Internal Estimated Profit:</span>
            <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-success)" }}>
              Rs. {formatCurrency(costingCalculation.profitAmount)} ({costingCalculation.profitPercentage}%)
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="app-shell">
        {/* ==========================================================================
           MODERN SIDEBAR NAVIGATION (INVOICES, QUOTATIONS, MENU RATES MASTER)
           ========================================================================== */}
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <ElegantLogo />
            <div className="sidebar-brand-title">
              Jayani
              <span>Reception Hall</span>
            </div>
          </div>

          <div className="sidebar-section-label">Main Navigation</div>

          <button
            className={`sidebar-nav-item ${activeTab === "invoices" && currentView === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("invoices");
              setCurrentView("dashboard");
            }}
          >
            <FileText size={18} />
            <span>Invoices</span>
            <span className="nav-badge">{invoices.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "quotations" && currentView === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("quotations");
              setCurrentView("dashboard");
            }}
          >
            <Send size={18} />
            <span>Quotations (Leads)</span>
            <span className="nav-badge">{quotations.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === "items-master" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("items-master");
              setCurrentView("dashboard");
            }}
          >
            <Utensils size={18} />
            <span>Menu & Rates Master</span>
            <span className="nav-badge">{masterItems.length}</span>
          </button>

          <div className="sidebar-section-label" style={{ marginTop: "1rem" }}>Quick Actions</div>

          <button
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "flex-start", gap: "0.6rem", borderColor: "rgba(212,175,55,0.4)", color: "var(--color-primary)" }}
            onClick={handleOpenCreateQuotation}
          >
            <Plus size={16} /> New Quotation
          </button>

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "flex-start", gap: "0.6rem" }}
            onClick={handleOpenCreateInvoice}
          >
            <Plus size={16} /> New Invoice
          </button>

          <div className="sidebar-footer">
            Jayani Reception Hall Suite v2.0
            <br />
            Costing & Profit Enabled
          </div>
        </aside>

        {/* ==========================================================================
           MAIN CONTENT AREA
           ========================================================================== */}
        <div className="app-content-area">
          <header className="app-header">
            <div>
              <h2 style={{ fontSize: "1.25rem", color: "var(--color-text-main)", fontWeight: "700" }}>
                {activeTab === "invoices" && "Invoices & Revenue Management"}
                {activeTab === "quotations" && "Lead Quotations & Event Pricing"}
                {activeTab === "items-master" && "Menu Catalog & Item Rates Master"}
              </h2>
            </div>
            <div className="header-actions" style={{ display: "flex", gap: "0.75rem" }}>
              {currentView !== "dashboard" && (
                <button className="btn btn-secondary" onClick={() => setCurrentView("dashboard")}>
                  Back to Dashboard
                </button>
              )}
            </div>
          </header>

          <main className="app-main">
            {error && (
              <div
                className="glass-card"
                style={{
                  borderLeft: "4px solid var(--color-error)",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  color: "#ff8b8b"
                }}
              >
                <AlertCircle size={24} />
                <span>{error}</span>
              </div>
            )}

            {/* ==========================================================================
               VIEW: MASTER ITEMS & RATES CATALOG MANAGER
               ========================================================================== */}
            {activeTab === "items-master" && currentView === "dashboard" && (
              <div className="glass-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)", fontSize: "1.4rem" }}>
                      Menu Items, Rates & Costing Master
                    </h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      Manage buffet items, package services, bites, desserts, and staff costs. Buffet/dessert multiply by guest count, package multiply only one, bites default for 200 guests.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      className="btn btn-secondary"
                      onClick={handleResetMasterItemsFromExcel}
                      title="Reload initial rates from Excel Wedding Package Sheet"
                    >
                      <RefreshCw size={15} /> Reset from Excel Sheet
                    </button>
                    <button className="btn btn-primary" onClick={handleOpenAddMasterItem}>
                      <Plus size={16} /> Add Item
                    </button>
                  </div>
                </div>

                {/* Category Navigation Tabs */}
                <div className="nav-tabs">
                  <button
                    className={`nav-tab ${masterCategoryFilter === "all" ? "active" : ""}`}
                    onClick={() => setMasterCategoryFilter("all")}
                  >
                    All Items <span className="tab-count">{masterItems.length}</span>
                  </button>
                  <button
                    className={`nav-tab ${masterCategoryFilter === "buffet" ? "active" : ""}`}
                    onClick={() => setMasterCategoryFilter("buffet")}
                  >
                    <Utensils size={16} /> Buffet <span className="tab-count">{masterItems.filter(i => i.Category === "buffet").length}</span>
                  </button>
                  <button
                    className={`nav-tab ${masterCategoryFilter === "bites" ? "active" : ""}`}
                    onClick={() => setMasterCategoryFilter("bites")}
                  >
                    <Wine size={16} /> Bites (200 Base) <span className="tab-count">{masterItems.filter(i => i.Category === "bites").length}</span>
                  </button>
                  <button
                    className={`nav-tab ${masterCategoryFilter === "package" ? "active" : ""}`}
                    onClick={() => setMasterCategoryFilter("package")}
                  >
                    <Package size={16} /> Package Items <span className="tab-count">{masterItems.filter(i => i.Category === "package").length}</span>
                  </button>
                  <button
                    className={`nav-tab ${masterCategoryFilter === "dessert" ? "active" : ""}`}
                    onClick={() => setMasterCategoryFilter("dessert")}
                  >
                    <Coffee size={16} /> Desserts <span className="tab-count">{masterItems.filter(i => i.Category === "dessert").length}</span>
                  </button>
                  <button
                    className={`nav-tab ${masterCategoryFilter === "operations" ? "active" : ""}`}
                    onClick={() => setMasterCategoryFilter("operations")}
                  >
                    <Sliders size={16} /> Staff & Operations <span className="tab-count">{masterItems.filter(i => i.Category === "operations").length}</span>
                  </button>
                </div>

                {/* Search box */}
                <div className="controls-row">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search items, rates, ingredients..."
                      value={masterSearchQuery}
                      onChange={(e) => setMasterSearchQuery(e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    Showing {filteredMasterItems.length} catalog items
                  </span>
                </div>

                {/* Master Items Data Table */}
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Multiplier Rule</th>
                        <th>Base Qty</th>
                        <th>Unit Cost (Rs.)</th>
                        <th>Default Selling (Rs.)</th>
                        <th>Margin</th>
                        <th>Quotation Price Basis</th>
                        <th>Status</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMasterItems.map((item) => {
                        const marginVal = item.CostPrice > 0
                          ? (((item.SellingPrice - item.CostPrice) / item.CostPrice) * 100).toFixed(0)
                          : 0;

                        return (
                          <tr key={item.ItemId}>
                            <td>
                              <div style={{ fontWeight: "600", color: "var(--color-text-main)" }}>
                                {item.ItemName}
                              </div>
                              {item.Notes && (
                                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                  {item.Notes}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`category-tag ${item.Category}`}>
                                {item.Category}
                              </span>
                            </td>
                            <td>
                              <span className="multiplier-pill">
                                {item.MultiplierType === "per_guest" && "Per Guest (x Guests)"}
                                {item.MultiplierType === "fixed" && "Fixed (x 1 Only)"}
                                {item.MultiplierType === "bites_200" && "Bites (Base for 200 Guests)"}
                                {item.MultiplierType === "staff_200" && "Staff (Base for 200 Guests)"}
                              </span>
                            </td>
                            <td style={{ fontWeight: "600" }}>
                              {item.BaseQuantity} {item.Unit}
                            </td>
                            <td style={{ fontWeight: "600", color: "#f59e0b" }}>
                              Rs. {formatCurrency(item.CostPrice)}
                            </td>
                            <td style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                              Rs. {formatCurrency(item.SellingPrice)}
                            </td>
                            <td style={{ fontSize: "0.85rem", color: marginVal >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
                              {marginVal}%
                            </td>
                            <td>
                              <button
                                type="button"
                                style={{
                                  cursor: "pointer",
                                  border: "1px solid",
                                  borderColor: item.QuotationPriceType === "selling" ? "#10b981" : "#f59e0b",
                                  background: item.QuotationPriceType === "selling" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                  color: item.QuotationPriceType === "selling" ? "#34d399" : "#fbbf24",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "6px",
                                  fontSize: "0.78rem",
                                  fontWeight: "600",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem"
                                }}
                                title="Click to toggle between Cost Price and Selling Price for Quotations"
                                onClick={() => handleToggleMasterPriceType(item)}
                              >
                                <span>{item.QuotationPriceType === "selling" ? "Selling Price" : "Cost Price"}</span>
                                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>⇄</span>
                              </button>
                            </td>
                            <td>
                              <span className={`badge ${item.IsActive !== false ? "badge-paid" : "badge-overdue"}`}>
                                {item.IsActive !== false ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td>
                              <div className="actions-cell" style={{ justifyContent: "center" }}>
                                <button
                                  className="action-btn"
                                  title="Edit Item Rates"
                                  onClick={() => handleOpenEditMasterItem(item)}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  className="action-btn delete"
                                  title="Delete Item"
                                  onClick={() => handleDeleteMasterItem(item.ItemId)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==========================================================================
               VIEW: DASHBOARD (INVOICES OR QUOTATIONS TABS)
               ========================================================================== */}
            {activeTab !== "items-master" && currentView === "dashboard" && (
              <>
                {/* Invoice Statistics Row */}
                {activeTab === "invoices" ? (
                  <>
                    <div className="stats-grid">
                      <div className="glass-card stat-card">
                        <div className="stat-icon">
                          <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-label">Total Invoiced</span>
                          <span className="stat-val">Rs. {formatCurrency(stats.TotalInvoiced)}</span>
                        </div>
                      </div>

                      <div className="glass-card stat-card">
                        <div className="stat-icon received">
                          <DollarSign size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-label">Total Received</span>
                          <span className="stat-val">Rs. {formatCurrency(stats.TotalPaid)}</span>
                        </div>
                      </div>

                      <div className="glass-card stat-card">
                        <div className="stat-icon balance">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-label">Outstanding Balance</span>
                          <span className="stat-val">Rs. {formatCurrency(stats.TotalBalance)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="controls-row">
                        <div className="search-box">
                          <Search size={18} />
                          <input
                            type="text"
                            placeholder="Search customer, invoice..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                            Showing {filteredInvoices.length} invoices
                          </span>
                          <button className="btn btn-primary" onClick={handleOpenCreateInvoice}>
                            <Plus size={16} /> Create Invoice
                          </button>
                        </div>
                      </div>

                      {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem" }}>
                          <p style={{ color: "var(--color-text-muted)" }}>Loading records from Database...</p>
                        </div>
                      ) : filteredInvoices.length === 0 ? (
                        <div className="empty-state">
                          <FileText />
                          <h4>No invoices found</h4>
                          <p>Get started by creating a new customer invoice record.</p>
                          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={handleOpenCreateInvoice}>
                            <Plus size={16} /> Create First Invoice
                          </button>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Inv No.</th>
                                <th>Customer</th>
                                <th>Function Date</th>
                                <th>Guests</th>
                                <th>Total Price (Rs.)</th>
                                <th>Paid (Rs.)</th>
                                <th>Balance (Rs.)</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredInvoices.map((inv) => {
                                const statusClass = inv.TotalBalance <= 0 ? "badge-paid" : inv.TotalPaid > 0 ? "badge-pending" : "badge-overdue";
                                const statusText = inv.TotalBalance <= 0 ? "Fully Paid" : inv.TotalPaid > 0 ? "Partial Paid" : "Unpaid";

                                return (
                                  <tr key={inv.InvoiceId}>
                                    <td style={{ fontWeight: "700", color: "var(--color-primary)" }}>{inv.InvoiceNumber}</td>
                                    <td>
                                      <div style={{ fontWeight: "600" }}>{inv.CustomerName}</div>
                                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{inv.Telephone}</div>
                                    </td>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <Calendar size={14} className="text-primary" />
                                        <span>{new Date(inv.FunctionDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                                      </div>
                                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{inv.FunctionType}</span>
                                    </td>
                                    <td style={{ fontWeight: "500" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <Users size={14} />
                                        <span>{inv.Guests}</span>
                                      </div>
                                    </td>
                                    <td style={{ fontWeight: "600" }}>{formatCurrency(inv.TotalPrice)}</td>
                                    <td style={{ color: "var(--color-success)", fontWeight: "500" }}>{formatCurrency(inv.TotalPaid)}</td>
                                    <td style={{ color: inv.TotalBalance > 0 ? "var(--color-error)" : "var(--color-text-main)", fontWeight: "600" }}>
                                      {formatCurrency(inv.TotalBalance)}
                                    </td>
                                    <td>
                                      <span className={`badge ${statusClass}`}>{statusText}</span>
                                    </td>
                                    <td>
                                      <div className="actions-cell" style={{ justifyContent: "center" }}>
                                        <button className="action-btn" title="Add / View Payments" onClick={() => handleOpenPayment(inv)}>
                                          <DollarSign size={16} />
                                        </button>
                                        <button className="action-btn" title="PDF Preview" onClick={() => handlePreviewInvoice(inv)}>
                                          <Eye size={16} />
                                        </button>
                                        <button className="action-btn" title="Print Invoice / Receipts" onClick={() => handlePrintClick(inv)}>
                                          <Printer size={16} />
                                        </button>
                                        <button className="action-btn" title="View Internal Costing Sheet" onClick={() => handlePreviewInvoice(inv, "costing")}>
                                          <FileSpreadsheet size={16} />
                                        </button>
                                        <button className="action-btn" title="Download PDF Invoice" onClick={() => handleDownloadPDF(inv)}>
                                          <Download size={16} />
                                        </button>
                                        <button className="action-btn" title="Edit Invoice" onClick={() => handleEditClick(inv)}>
                                          <Edit3 size={16} />
                                        </button>
                                        <button className="action-btn delete" title="Delete Record" onClick={() => handleDeleteInvoice(inv.InvoiceId)}>
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Quotation Statistics Row */}
                    <div className="stats-grid">
                      <div className="glass-card stat-card">
                        <div className="stat-icon">
                          <Send size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-label">Total Quotations</span>
                          <span className="stat-val">{quotations.length}</span>
                        </div>
                      </div>

                      <div className="glass-card stat-card">
                        <div className="stat-icon received">
                          <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-label">Total Quoted Value</span>
                          <span className="stat-val">
                            Rs. {formatCurrency(quotations.reduce((sum, q) => sum + (parseFloat(q.TotalPrice) || 0), 0))}
                          </span>
                        </div>
                      </div>

                      <div className="glass-card stat-card">
                        <div className="stat-icon">
                          <CheckCircle2 size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-label">Accepted Leads</span>
                          <span className="stat-val">
                            {quotations.filter((q) => q.Status === "Accepted").length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="controls-row">
                        <div className="search-box">
                          <Search size={18} />
                          <input
                            type="text"
                            placeholder="Search lead name, quotation no, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                            Showing {filteredQuotations.length} quotations
                          </span>
                          <button className="btn btn-primary" onClick={handleOpenCreateQuotation}>
                            <Plus size={16} /> Create Quotation
                          </button>
                        </div>
                      </div>

                      {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem" }}>
                          <p style={{ color: "var(--color-text-muted)" }}>Loading quotations...</p>
                        </div>
                      ) : filteredQuotations.length === 0 ? (
                        <div className="empty-state">
                          <Send />
                          <h4>No quotations found</h4>
                          <p>Create a quotation with Cost & Profit planning to send to your lead.</p>
                          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={handleOpenCreateQuotation}>
                            <Plus size={16} /> Create First Quotation
                          </button>
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Quotation No.</th>
                                <th>Lead Details</th>
                                <th>Event Date</th>
                                <th>Guests</th>
                                <th>Cost Analysis</th>
                                <th>Quoted Price (Rs.)</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredQuotations.map((quo) => {
                                const statusLower = (quo.Status || "Sent").toLowerCase();
                                const badgeClass =
                                  statusLower === "accepted"
                                    ? "badge-accepted"
                                    : statusLower === "draft"
                                      ? "badge-draft"
                                      : statusLower === "expired"
                                        ? "badge-expired"
                                        : "badge-sent";

                                return (
                                  <tr key={quo.QuotationId}>
                                    <td style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                                      {quo.QuotationNumber}
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: "600" }}>{quo.LeadName}</div>
                                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                        {quo.Telephone || "No phone"}
                                        {quo.Email ? ` • ${quo.Email}` : ""}
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <Calendar size={14} className="text-primary" />
                                        <span>
                                          {quo.FunctionDate
                                            ? new Date(quo.FunctionDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                                            : "TBD / Not Set"}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{quo.FunctionType}</span>
                                    </td>
                                    <td style={{ fontWeight: "500" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <Users size={14} />
                                        <span>{quo.Guests}</span>
                                      </div>
                                    </td>
                                    <td>
                                      {quo.TotalCost > 0 ? (
                                        <div style={{ fontSize: "0.78rem" }}>
                                          <div style={{ color: "#f59e0b" }}>Cost: Rs. {formatCurrency(quo.TotalCost)}</div>
                                          <div style={{ color: "var(--color-success)", fontWeight: "600" }}>
                                            Profit: Rs. {formatCurrency(quo.ProfitAmount)} ({quo.ProfitPercentage}%)
                                          </div>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Standard</span>
                                      )}
                                    </td>
                                    <td style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                                      Rs. {formatCurrency(quo.TotalPrice)}
                                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                        Plate: Rs. {formatCurrency(quo.PlatePrice)}
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`badge ${badgeClass}`}>{quo.Status || "Sent"}</span>
                                    </td>
                                    <td>
                                      <div className="actions-cell" style={{ justifyContent: "center" }}>
                                        <button className="action-btn" title="PDF Preview" onClick={() => handlePreviewQuotation(quo, "customer")}>
                                          <Eye size={16} />
                                        </button>
                                        <button className="action-btn" title="Print Quotation" onClick={() => handlePrintQuotationClick(quo, "customer")}>
                                          <Printer size={16} />
                                        </button>
                                        <button className="action-btn" title="View Internal Costing Sheet" onClick={() => handlePreviewQuotation(quo, "costing")}>
                                          <FileSpreadsheet size={16} />
                                        </button>
                                        <button className="action-btn" title="Edit Quotation" onClick={() => handleEditQuotationClick(quo)}>
                                          <Edit3 size={16} />
                                        </button>
                                        <button className="action-btn" title="Download PDF Quotation" onClick={() => handleDownloadQuotationPDF(quo)}>
                                          <Download size={16} />
                                        </button>
                                        <button className="action-btn" title="Convert to Invoice" onClick={() => handleConvertQuotationToInvoice(quo)}>
                                          <FileCheck size={16} />
                                        </button>
                                        <button className="action-btn delete" title="Delete Quotation" onClick={() => handleDeleteQuotation(quo.QuotationId)}>
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ==========================================================================
               VIEW: CREATE OR EDIT QUOTATION (WITH COST & PROFIT PLANNER)
               ========================================================================== */}
            {(currentView === "create-quotation" || currentView === "edit-quotation") && (
              <div className="glass-card" style={{ maxWidth: "1050px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)", fontSize: "1.5rem" }}>
                      {currentView === "create-quotation" ? "Create Lead Quotation with Cost & Profit Planner" : `Edit Quotation ${selectedQuotation?.QuotationNumber}`}
                    </h2>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      Follows the Wedding Package Sheet: Buffet and Desserts multiply by guest count, Package details multiply only one, Bites default for 200 guests.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="button" className="btn btn-secondary" onClick={handlePreviewQuotationForm} style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                      <Eye size={16} /> Preview PDF
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreateOrUpdateQuotation}>
                  {/* Lead Information Row */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Lead / Customer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. K.A. Kasun Perera"
                        value={quotationForm.leadName}
                        onChange={(e) => setQuotationForm({ ...quotationForm, leadName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Telephone / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="e.g. 077 123 4567"
                        value={quotationForm.telephone}
                        onChange={(e) => setQuotationForm({ ...quotationForm, telephone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Lead Email</label>
                      <input
                        type="email"
                        placeholder="e.g. lead@example.com"
                        value={quotationForm.email}
                        onChange={(e) => setQuotationForm({ ...quotationForm, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Quotation Status</label>
                      <select
                        value={quotationForm.status}
                        onChange={(e) => setQuotationForm({ ...quotationForm, status: e.target.value })}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent to Lead</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Event Date (Optional)</label>
                      <input
                        type="date"
                        value={quotationForm.functionDate}
                        onChange={(e) => setQuotationForm({ ...quotationForm, functionDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Quotation Valid Until</label>
                      <input
                        type="date"
                        value={quotationForm.validUntil}
                        onChange={(e) => setQuotationForm({ ...quotationForm, validUntil: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Function Type *</label>
                      <select
                        value={quotationForm.functionType}
                        onChange={(e) => setQuotationForm({ ...quotationForm, functionType: e.target.value })}
                      >
                        <option value="Wedding Date :Day function">Wedding - Day Function</option>
                        <option value="Wedding Date :Night function">Wedding - Night Function</option>
                        <option value="HomeComing :Day function">HomeComing  - Day Function</option>
                        <option value="HomeComing :Night function">HomeComing  - Night Function</option>
                        <option value="Engagement Party">Engagement Party</option>
                        <option value="Birthday Party">Birthday Party</option>
                        <option value="Corporate Event">Corporate Event</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Lead Address</label>
                      <input
                        type="text"
                        placeholder="e.g. No 72, Dewala Rd, Kahatawila"
                        value={quotationForm.leadAddress}
                        onChange={(e) => setQuotationForm({ ...quotationForm, leadAddress: e.target.value })}
                      />
                    </div>
                  </div>

                  {renderWeddingPackagePlannerSection(false)}

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setCurrentView("dashboard")}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }} onClick={handlePreviewQuotationForm}>
                      <Eye size={16} /> Preview PDF
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {currentView === "create-quotation" ? "Save Quotation" : "Update Quotation"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==========================================================================
               VIEW: CREATE OR EDIT INVOICE (WITH COST & PROFIT PLANNER)
               ========================================================================== */}
            {(currentView === "create" || currentView === "edit") && (
              <div className="glass-card" style={{ maxWidth: "1050px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)", fontSize: "1.5rem" }}>
                      {currentView === "create" ? "Create New Invoice with Cost & Profit Planner" : `Edit Invoice ${selectedInvoice?.InvoiceNumber}`}
                    </h2>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      Follows the Wedding Package Sheet: Buffet and Desserts multiply by guest count, Package details multiply only one, Bites default for 200 guests.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="button" className="btn btn-secondary" onClick={handlePreviewInvoiceForm} style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                      <Eye size={16} /> Preview PDF
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreateOrUpdateInvoice}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Customer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. H.A.Muditha Dayani"
                        value={invoiceForm.customerName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Telephone</label>
                      <input
                        type="text"
                        placeholder="e.g. 076 418 0525"
                        value={invoiceForm.telephone}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, telephone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Function Date *</label>
                      <input
                        type="date"
                        required
                        value={invoiceForm.functionDate}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, functionDate: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Function Type *</label>
                      <select
                        value={invoiceForm.functionType}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, functionType: e.target.value })}
                      >
                        <option value="Wedding Date :Day function">Wedding - Day Function</option>
                        <option value="Wedding Date :Night function">Wedding - Night Function</option>
                        <option value="HomeComing :Day function">HomeComing  - Day Function</option>
                        <option value="HomeComing :Night function">HomeComing  - Night Function</option>
                        <option value="Engagement Party">Engagement Party</option>
                        <option value="Birthday Party">Birthday Party</option>
                        <option value="Corporate Event">Corporate Event</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label>Customer Address</label>
                      <input
                        type="text"
                        placeholder="e.g. No 72, Dewala Rd, Kahatawila, Lihiriyagama"
                        value={invoiceForm.customerAddress}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })}
                      />
                    </div>
                  </div>

                  {renderWeddingPackagePlannerSection(true)}

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setCurrentView("dashboard")}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }} onClick={handlePreviewInvoiceForm}>
                      <Eye size={16} /> Preview PDF
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {currentView === "create" ? "Save Invoice" : "Update Invoice"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ==========================================================================
         MODAL: ADD / EDIT MASTER ITEM
         ========================================================================== */}
      {showMasterItemModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>{editingMasterItem ? "Edit Master Catalog Item" : "Add New Item to Catalog"}</h3>
              <button className="action-btn" onClick={() => setShowMasterItemModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMasterItem}>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group full-width">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Devilled Chicken (කුකුළු මස් බයිට්)"
                    value={masterItemForm.itemName}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, itemName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={masterItemForm.category}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, category: e.target.value })}
                  >
                    <option value="buffet">Buffet Menu & Items</option>
                    <option value="bites">Bites</option>
                    <option value="package">Package Items & Services</option>
                    <option value="dessert">Desserts</option>
                    <option value="operations">Staff & Operations</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Multiplier Rule *</label>
                  <select
                    value={masterItemForm.multiplierType}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, multiplierType: e.target.value })}
                  >
                    <option value="per_guest">Per Guest (x Guest Count)</option>
                    <option value="fixed">Fixed Service (x 1 Only)</option>
                    <option value="bites_200">Bites Rule (Base for 200 Guests)</option>
                    <option value="staff_200">Staff Rule (Base for 200 Guests)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Quantity (for 200 guests or fixed)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={masterItemForm.baseQuantity}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, baseQuantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Kg, Pcs, Plate, Service"
                    value={masterItemForm.unit}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Cost Price to Hotel (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={masterItemForm.costPrice}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, costPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label>Default Selling Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={masterItemForm.sellingPrice}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Quotation Price Basis (මිල පදනම) *</label>
                  <select
                    value={masterItemForm.quotationPriceType || "cost"}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, quotationPriceType: e.target.value })}
                  >
                    <option value="cost">Cost Price (පිරිවැය මිල - Rs. {formatCurrency(masterItemForm.costPrice)})</option>
                    <option value="selling">Selling Price (විකුණුම් මිල - Rs. {formatCurrency(masterItemForm.sellingPrice)})</option>
                  </select>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem", display: "block" }}>
                    Select whether creating a quotation fetches the Cost Price or Selling Price for this item.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label>Notes / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 40 kg default for 200 guests"
                    value={masterItemForm.notes}
                    onChange={(e) => setMasterItemForm({ ...masterItemForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMasterItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMasterItem ? "Update Master Item" : "Save Item to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
         MODAL: PAYMENTS MANAGEMENT
         ========================================================================== */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3>Record Payments: {selectedInvoice.InvoiceNumber}</h3>
              <button className="action-btn" onClick={() => setShowPaymentModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem", background: "rgba(0,0,0,0.15)", padding: "1rem", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Customer:</span>
                <div style={{ fontWeight: "600" }}>{selectedInvoice.CustomerName}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Invoice:</span>
                <div style={{ fontWeight: "600", color: "var(--color-primary)" }}>Rs. {formatCurrency(selectedInvoice.TotalPrice)}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Paid:</span>
                <div style={{ fontWeight: "600", color: "var(--color-success)" }}>Rs. {formatCurrency(selectedInvoice.TotalPaid)}</div>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Outstanding Balance:</span>
                <div style={{ fontWeight: "600", color: "var(--color-error)" }}>Rs. {formatCurrency(selectedInvoice.TotalBalance)}</div>
              </div>
            </div>

            <form onSubmit={handleAddPayment} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
              <h4 style={{ color: "var(--color-primary)", marginBottom: "1rem", fontSize: "1rem" }}>Record New Payment</h4>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Amount (Rs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="Amount to pay"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description / Reference</label>
                  <select
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  >
                    <option value="Advanced Payment">Advanced Payment</option>
                    <option value="Second Payment">Second Payment</option>
                    <option value="Third Payment">Third Payment</option>
                    <option value="Final Balance">Final Balance</option>
                    <option value="Refundable Deposit">Refundable Deposit</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Save Payment Receipt
              </button>
            </form>

            <div>
              <h4 style={{ marginBottom: "0.75rem", fontSize: "1.05rem" }}>Payment Receipt History</h4>
              {!selectedInvoice.payments || selectedInvoice.payments.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "1rem" }}>
                  No payments recorded for this invoice yet.
                </p>
              ) : (
                <div className="payment-history-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.PaymentId} className="payment-item">
                      <div className="payment-item-details">
                        <span className="payment-item-desc">{p.Description}</span>
                        <span className="payment-item-date">{formatDate(p.PaymentDate)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className="payment-item-amount">Rs. {formatCurrency(p.Amount)}</span>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => handleDeletePayment(p.PaymentId)}
                          title="Delete Payment Record"
                          style={{ padding: "0.25rem", color: "var(--color-danger)", background: "transparent", border: "none", cursor: "pointer" }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
         FULL-SCREEN PDF & PRINT PREVIEW MODAL
         ========================================================================== */}
      {showPdfPreview && previewDoc && (
        <div className="pdf-modal-overlay">
          <div className="pdf-modal-toolbar">
            <div className="pdf-modal-title">
              <span className="badge" style={{ background: "rgba(212, 175, 55, 0.2)", color: "var(--color-primary)", border: "1px solid var(--color-primary)" }}>
                {previewDoc.type === "quotation" ? "QUOTATION PREVIEW" : "INVOICE PREVIEW"}
              </span>
              <span>
                {previewDoc.type === "quotation"
                  ? `${previewDoc.data.QuotationNumber} — ${previewDoc.data.LeadName}`
                  : `${previewDoc.data.InvoiceNumber} — ${previewDoc.data.CustomerName}`}
              </span>
            </div>

            <div className="pdf-modal-actions">
              {/* Toggle Customer Document vs Internal Costing Sheet */}
              <div className="pdf-view-toggle">
                <button
                  type="button"
                  className={previewSheetMode === "customer" ? "active" : ""}
                  onClick={() => {
                    setPreviewSheetMode("customer");
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl("");
                    }
                    setPdfViewMode("sheet");
                  }}
                >
                  {previewDoc.type === "quotation" ? "Customer Quotation" : "Customer Invoice"}
                </button>
                <button
                  type="button"
                  className={previewSheetMode === "costing" ? "active" : ""}
                  onClick={() => {
                    setPreviewSheetMode("costing");
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl("");
                    }
                    setPdfViewMode("sheet");
                  }}
                >
                  Internal Costing Sheet (Excel)
                </button>
              </div>

              <div className="pdf-view-toggle">
                <button
                  type="button"
                  className={pdfViewMode === "sheet" ? "active" : ""}
                  onClick={() => setPdfViewMode("sheet")}
                >
                  A4 Page
                </button>
                <button
                  type="button"
                  className={pdfViewMode === "pdf" ? "active" : ""}
                  onClick={handleSwitchToEmbeddedPdf}
                >
                  PDF Reader
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={pdfGenerating}
                onClick={handleDownloadFromPreview}
              >
                <Download size={16} /> {pdfGenerating ? "Generating..." : "Download PDF"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPdfPreview(false)}
                title="Close Preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="pdf-modal-body">
            {pdfViewMode === "sheet" ? (
              <div className="pdf-preview-sheet">{renderDocumentContent(previewDoc)}</div>
            ) : (
              <div className="pdf-iframe-container">
                {pdfGenerating || !pdfBlobUrl ? (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", gap: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", border: "4px solid rgba(212,175,55,0.2)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "fadeIn 0.8s linear infinite" }} />
                    <span>Rendering PDF document preview...</span>
                  </div>
                ) : (
                  <iframe src={pdfBlobUrl} title="PDF Document Preview" />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
         PRINT CONTAINER (FOR PRINT / PDF GENERATION)
         ========================================================================== */}
      {previewDoc && (
        <div className="invoice-print-container" id="printable-invoice">
          {renderDocumentContent(previewDoc)}
        </div>
      )}
    </>
  );
}
