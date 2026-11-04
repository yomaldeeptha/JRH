const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { sql, poolPromise } = require("./db");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure Quotations and MasterItems tables exist on startup
const DEFAULT_MASTER_ITEMS = [
  // --- Buffet Menu Packages & Items (per_guest) ---
  { itemName: "Menu 02 (Standard Wedding Buffet)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Plate", costPrice: 1100, sellingPrice: 1600, sortOrder: 1 },
  { itemName: "Menu 01 (Economy Wedding Buffet)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Plate", costPrice: 900, sellingPrice: 1400, sortOrder: 2 },
  { itemName: "පිළිගැනීමේ බීම (Welcome Drink)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Glass", costPrice: 50, sellingPrice: 70, sortOrder: 3 },
  { itemName: "සුදු බත් (White Rice)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 55, sellingPrice: 80, sortOrder: 4 },
  { itemName: "එළවළු බත් (Vegetable Rice)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 75, sellingPrice: 110, sortOrder: 5 },
  { itemName: "නූඩ්ල්ස් (Noodles)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 65, sellingPrice: 95, sortOrder: 6 },
  { itemName: "පැස්ටා (Pasta)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 75, sellingPrice: 110, sortOrder: 7 },
  { itemName: "කුකුළු මස් (Chicken Curry / Roast)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 180, sellingPrice: 260, sortOrder: 8 },
  { itemName: "මාළු (Fish Curry / Devilled)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 150, sellingPrice: 220, sortOrder: 9 },
  { itemName: "ඉස්සන් (Prawns)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 220, sellingPrice: 320, sortOrder: 10 },
  { itemName: "පරිප්පු (Dhal)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 30, sellingPrice: 45, sortOrder: 11 },
  { itemName: "අල (Potato Curry)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 40, sellingPrice: 60, sortOrder: 12 },
  { itemName: "කජු (Cashew Curry)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 120, sellingPrice: 175, sortOrder: 13 },
  { itemName: "බටු මෝජු (Brinjal Moju)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 50, sellingPrice: 75, sortOrder: 14 },
  { itemName: "අච්චාරු (Pickle)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 30, sellingPrice: 45, sortOrder: 15 },
  { itemName: "කට්ලට් (Buffet Cutlet)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Pcs", costPrice: 20, sellingPrice: 30, sortOrder: 16 },
  { itemName: "පපඩම් (Papadum)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 15, sellingPrice: 25, sortOrder: 17 },
  { itemName: "සලාද (Salad)", category: "buffet", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 30, sellingPrice: 45, sortOrder: 18 },

  // --- Desserts (per_guest) ---
  { itemName: "වටලප්පන් (Watalappam)", category: "dessert", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 65, sellingPrice: 95, sortOrder: 19 },
  { itemName: "පළතුරු (Fruit Salad / Fresh Fruits)", category: "dessert", multiplierType: "per_guest", baseQuantity: 1, unit: "Portion", costPrice: 50, sellingPrice: 75, sortOrder: 20 },
  { itemName: "අයිස් ක්‍රීම් (Ice Cream)", category: "dessert", multiplierType: "per_guest", baseQuantity: 1, unit: "Cup", costPrice: 55, sellingPrice: 80, sortOrder: 21 },
  { itemName: "ජෙලි (Jelly)", category: "dessert", multiplierType: "per_guest", baseQuantity: 1, unit: "Cup", costPrice: 30, sellingPrice: 40, sortOrder: 22 },
  { itemName: "අයිස් කෝපි (Ice Coffee)", category: "dessert", multiplierType: "per_guest", baseQuantity: 1, unit: "Glass", costPrice: 55, sellingPrice: 70, sortOrder: 23 },

  // --- Bites (bites_200: Base quantity specified for 200 guests) ---
  { itemName: "Devilled Chicken (කුකුළු මස් බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 40, unit: "Kg", costPrice: 1800, sellingPrice: 2400, notes: "40 kg default for 200 guests", sortOrder: 24 },
  { itemName: "Devilled Pork (ඌරු මස් බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 10, unit: "Kg", costPrice: 1800, sellingPrice: 2500, notes: "10 kg default for 200 guests", sortOrder: 25 },
  { itemName: "Sausages (සොසේජස් බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 8, unit: "Kg", costPrice: 2000, sellingPrice: 2800, notes: "8 kg default for 200 guests", sortOrder: 26 },
  { itemName: "Boiled Vegetables (තැම්බූ එළවළු)", category: "bites", multiplierType: "bites_200", baseQuantity: 16, unit: "Kg", costPrice: 500, sellingPrice: 900, notes: "16 kg default for 200 guests", sortOrder: 27 },
  { itemName: "Chickpeas (කඩල බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 6, unit: "Kg", costPrice: 1000, sellingPrice: 1600, notes: "6 kg default for 200 guests", sortOrder: 28 },
  { itemName: "Mixed Bites / Murukku (මිශ්‍ර බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 2, unit: "Kg", costPrice: 1200, sellingPrice: 1800, notes: "2 kg default for 200 guests", sortOrder: 29 },
  { itemName: "Cutlet (කට්ලට් බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 600, unit: "Pcs", costPrice: 25, sellingPrice: 40, notes: "600 pcs default for 200 guests", sortOrder: 30 },
  { itemName: "Devilled Fish (මාළු බයිට්)", category: "bites", multiplierType: "bites_200", baseQuantity: 20, unit: "Kg", costPrice: 1800, sellingPrice: 2500, notes: "20 kg default for 200 guests", sortOrder: 31 },
  { itemName: "Hot Butter Cuttlefish (හොට් බටර් කට්ල්ෆිෂ්)", category: "bites", multiplierType: "bites_200", baseQuantity: 15, unit: "Kg", costPrice: 2500, sellingPrice: 3500, notes: "15 kg default for 200 guests", sortOrder: 32 },
  { itemName: "Roasted Cashew Nuts (බැදපු කජු)", category: "bites", multiplierType: "bites_200", baseQuantity: 5, unit: "Kg", costPrice: 4500, sellingPrice: 6000, notes: "5 kg default for 200 guests", sortOrder: 33 },
  { itemName: "French Fries (ෆ්‍රෙන්ච් ෆ්‍රයිස්)", category: "bites", multiplierType: "bites_200", baseQuantity: 15, unit: "Kg", costPrice: 1200, sellingPrice: 1800, notes: "15 kg default for 200 guests", sortOrder: 34 },

  // --- Package Details & Services (fixed: multiplier = 1) ---
  { itemName: "Dj (ඩීජේ සංගීතය)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Event", costPrice: 18000, sellingPrice: 25000, sortOrder: 35 },
  { itemName: "Kandyan Dancing Group (උඩරට නැටුම්)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Group", costPrice: 18000, sellingPrice: 25000, sortOrder: 36 },
  { itemName: "Sette Back (සෙටිබැක් සැරසිලි)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 40000, sellingPrice: 55000, sortOrder: 37 },
  { itemName: "Generator (ජෙනරේටර්)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Unit", costPrice: 15000, sellingPrice: 20000, sortOrder: 38 },
  { itemName: "Ashtaka (අෂ්ටක)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Service", costPrice: 10000, sellingPrice: 15000, sortOrder: 39 },
  { itemName: "Jayamangala Gatha (ජයමංගල ගාථා)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Service", costPrice: 6000, sellingPrice: 10000, sortOrder: 40 },
  { itemName: "Oil Lamp (පොල්තෙල් පහන)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 3000, sellingPrice: 5000, sortOrder: 41 },
  { itemName: "Poruwa (පෝරුව සැරසිලි)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 20000, sellingPrice: 30000, sortOrder: 42 },
  { itemName: "Table Decoration (මේස සැරසිලි)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 12000, sellingPrice: 18000, sortOrder: 43 },
  { itemName: "Head Table Decoration (ප්‍රධාන මේස සැරසිලි)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 12000, sellingPrice: 18000, sortOrder: 44 },
  { itemName: "Entrance Decoration (පිවිසුම් සැරසිලි)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 12000, sellingPrice: 18000, sortOrder: 45 },
  { itemName: "Cake Structure (කේක් ව්‍යුහය)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 6000, sellingPrice: 10000, sortOrder: 46 },
  { itemName: "Mal wedi , Batto (ගිනිකෙළි / බට්ටෝ)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Show", costPrice: 1000, sellingPrice: 2500, sortOrder: 47 },
  { itemName: "Ice / Fruit Carving (කැටයම්)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Setup", costPrice: 6000, sellingPrice: 10000, sortOrder: 48 },
  { itemName: "Punjab Dhol (පන්ජාබ් ඩෝල්)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Group", costPrice: 12000, sellingPrice: 18000, sortOrder: 49 },
  { itemName: "Soft Drink (සොෆ්ට් ඩ්‍රින්ක්ස් සේවා)", category: "package", multiplierType: "fixed", baseQuantity: 1, unit: "Batch", costPrice: 25000, sellingPrice: 32000, notes: "Soft Drinks included in wedding package", sortOrder: 50 },

  // --- Operations & Staff (staff_200: scaled with guests/200) ---
  { itemName: "Serve Boys (උපස්ථායකයින්)", category: "operations", multiplierType: "staff_200", baseQuantity: 8, unit: "Persons", costPrice: 3000, sellingPrice: 3500, notes: "8 boys default for 200 guests", sortOrder: 51 },
  { itemName: "Kitchen Helpers (කුස්සිය සහායකයින්)", category: "operations", multiplierType: "staff_200", baseQuantity: 2, unit: "Persons", costPrice: 2500, sellingPrice: 3000, notes: "2 helpers default for 200 guests", sortOrder: 52 },
  { itemName: "Other Hall Expenses (වෙනත් වියදම්)", category: "operations", multiplierType: "staff_200", baseQuantity: 1, unit: "Batch", costPrice: 10000, sellingPrice: 12000, notes: "Default for 200 guests", sortOrder: 53 },
  { itemName: "Park Helper (වාහන නැවතුම් සහායක)", category: "operations", multiplierType: "fixed", baseQuantity: 1, unit: "Person", costPrice: 2500, sellingPrice: 3000, sortOrder: 54 },
  { itemName: "Extra Chairs (අමතර පුටු)", category: "operations", multiplierType: "fixed", baseQuantity: 0, unit: "Chairs", costPrice: 100, sellingPrice: 150, notes: "For guests over 200", sortOrder: 55 }
];

async function seedMasterItems(pool) {
  for (const item of DEFAULT_MASTER_ITEMS) {
    await pool.request()
      .input("ItemName", sql.NVarChar(255), item.itemName)
      .input("Category", sql.VarChar(50), item.category)
      .input("MultiplierType", sql.VarChar(50), item.multiplierType)
      .input("BaseQuantity", sql.Decimal(18, 2), item.baseQuantity)
      .input("Unit", sql.NVarChar(50), item.unit)
      .input("CostPrice", sql.Decimal(18, 2), item.costPrice)
      .input("SellingPrice", sql.Decimal(18, 2), item.sellingPrice)
      .input("QuotationPriceType", sql.VarChar(20), item.quotationPriceType || "cost")
      .input("SortOrder", sql.Int, item.sortOrder || 0)
      .input("Notes", sql.NVarChar(500), item.notes || "")
      .query(`
        INSERT INTO MasterItems (ItemName, Category, MultiplierType, BaseQuantity, Unit, CostPrice, SellingPrice, QuotationPriceType, SortOrder, Notes)
        VALUES (@ItemName, @Category, @MultiplierType, @BaseQuantity, @Unit, @CostPrice, @SellingPrice, @QuotationPriceType, @SortOrder, @Notes);
      `);
  }
}

async function ensureSchema() {
  try {
    const pool = await poolPromise;
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Quotations')
      BEGIN
          CREATE TABLE Quotations (
              QuotationId INT IDENTITY(1,1) PRIMARY KEY,
              QuotationNumber VARCHAR(20) UNIQUE NOT NULL,
              LeadName NVARCHAR(255) NOT NULL,
              LeadAddress NVARCHAR(500),
              Telephone VARCHAR(50),
              Email NVARCHAR(255),
              FunctionDate DATE NULL,
              ValidUntil DATE,
              FunctionType NVARCHAR(100) NOT NULL,
              Guests INT NOT NULL,
              PlatePrice DECIMAL(18, 2) NOT NULL,
              TotalPrice DECIMAL(18, 2) NOT NULL,
              BillDetails NVARCHAR(MAX),
              IncludeMenu BIT DEFAULT 1,
              SelectedMenu NVARCHAR(MAX),
              SelectedBites NVARCHAR(MAX),
              SelectedPackages NVARCHAR(MAX),
              Notes NVARCHAR(MAX),
              Status VARCHAR(50) DEFAULT 'Sent',
              TotalCost DECIMAL(18, 2) DEFAULT 0,
              ProfitAmount DECIMAL(18, 2) DEFAULT 0,
              ProfitPercentage DECIMAL(18, 2) DEFAULT 25.0,
              CostPerPlate DECIMAL(18, 2) DEFAULT 0,
              CostBreakdownJson NVARCHAR(MAX),
              CreatedAt DATETIME DEFAULT GETDATE()
          );
      END
      ELSE
      BEGIN
          ALTER TABLE Quotations ALTER COLUMN FunctionDate DATE NULL;
      END

      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuotationItems')
      BEGIN
          CREATE TABLE QuotationItems (
              ItemId INT IDENTITY(1,1) PRIMARY KEY,
              QuotationId INT NOT NULL FOREIGN KEY REFERENCES Quotations(QuotationId) ON DELETE CASCADE,
              Description NVARCHAR(MAX) NOT NULL,
              Quantity INT NOT NULL,
              UnitPrice DECIMAL(18, 2) NOT NULL,
              Total DECIMAL(18, 2) NOT NULL
          );
      END

      -- Create MasterItems table
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MasterItems')
      BEGIN
          CREATE TABLE MasterItems (
              ItemId INT IDENTITY(1,1) PRIMARY KEY,
              ItemName NVARCHAR(255) NOT NULL,
              Category VARCHAR(50) NOT NULL,
              MultiplierType VARCHAR(50) NOT NULL,
              BaseQuantity DECIMAL(18, 2) DEFAULT 1,
              Unit NVARCHAR(50) DEFAULT 'Kg',
              CostPrice DECIMAL(18, 2) NOT NULL DEFAULT 0,
              SellingPrice DECIMAL(18, 2) NOT NULL DEFAULT 0,
              IsActive BIT DEFAULT 1,
              SortOrder INT DEFAULT 0,
              Notes NVARCHAR(500),
              CreatedAt DATETIME DEFAULT GETDATE()
          );
      END

      -- Ensure costing columns in Quotations
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'TotalCost')
      BEGIN
          ALTER TABLE Quotations ADD TotalCost DECIMAL(18, 2) DEFAULT 0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'ProfitAmount')
      BEGIN
          ALTER TABLE Quotations ADD ProfitAmount DECIMAL(18, 2) DEFAULT 0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'ProfitPercentage')
      BEGIN
          ALTER TABLE Quotations ADD ProfitPercentage DECIMAL(18, 2) DEFAULT 25.0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'CostPerPlate')
      BEGIN
          ALTER TABLE Quotations ADD CostPerPlate DECIMAL(18, 2) DEFAULT 0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'CostBreakdownJson')
      BEGIN
          ALTER TABLE Quotations ADD CostBreakdownJson NVARCHAR(MAX);
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'SelectedDesserts')
      BEGIN
          ALTER TABLE Quotations ADD SelectedDesserts NVARCHAR(MAX);
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'SelectedDesserts')
      BEGIN
          ALTER TABLE Invoices ADD SelectedDesserts NVARCHAR(MAX);
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'TotalCost')
      BEGIN
          ALTER TABLE Invoices ADD TotalCost DECIMAL(18, 2) DEFAULT 0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'ProfitAmount')
      BEGIN
          ALTER TABLE Invoices ADD ProfitAmount DECIMAL(18, 2) DEFAULT 0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'ProfitPercentage')
      BEGIN
          ALTER TABLE Invoices ADD ProfitPercentage DECIMAL(18, 2) DEFAULT 25.0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'CostPerPlate')
      BEGIN
          ALTER TABLE Invoices ADD CostPerPlate DECIMAL(18, 2) DEFAULT 0;
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'CostBreakdownJson')
      BEGIN
          ALTER TABLE Invoices ADD CostBreakdownJson NVARCHAR(MAX);
      END
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'Notes')
      BEGIN
          ALTER TABLE Invoices ADD Notes NVARCHAR(MAX);
      END

      -- Ensure QuotationPriceType column in MasterItems (allows choosing whether quotation gets cost price or selling price)
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MasterItems') AND name = 'QuotationPriceType')
      BEGIN
          ALTER TABLE MasterItems ADD QuotationPriceType VARCHAR(20) DEFAULT 'cost';
      END
    `);

    // Check if MasterItems table is empty, seed defaults
    const countRes = await pool.request().query("SELECT COUNT(*) AS ItemCount FROM MasterItems");
    if (countRes.recordset[0].ItemCount === 0) {
      await seedMasterItems(pool);
      console.log(`Seeded ${DEFAULT_MASTER_ITEMS.length} default master items.`);
    }

    console.log("Database schema verified (Invoices, Quotations & MasterItems).");
  } catch (err) {
    console.error("Error verifying database schema:", err);
  }
}
ensureSchema();

// Get dashboard stats
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COALESCE(SUM(TotalPrice), 0) AS TotalInvoiced,
        (SELECT COALESCE(SUM(Amount), 0) FROM Payments) AS TotalPaid,
        (COALESCE(SUM(TotalPrice), 0) - (SELECT COALESCE(SUM(Amount), 0) FROM Payments)) AS TotalBalance,
        COUNT(*) AS TotalInvoicesCount,
        (SELECT COUNT(*) FROM Quotations) AS TotalQuotationsCount,
        (SELECT COALESCE(SUM(TotalPrice), 0) FROM Quotations) AS TotalQuotedValue
      FROM Invoices
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard statistics" });
  }
});

// List all invoices with total paid and balance
app.get("/api/invoices", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT i.InvoiceId, i.InvoiceNumber, i.CustomerName, i.CustomerAddress, i.Telephone, 
             i.FunctionDate, i.FunctionType, i.Guests, i.PlatePrice, i.TotalPrice, i.BillDetails, i.IncludeMenu, i.SelectedMenu, i.SelectedDesserts, i.SelectedBites, i.SelectedPackages,
             i.Notes, i.TotalCost, i.ProfitAmount, i.ProfitPercentage, i.CostPerPlate, i.CreatedAt,
             COALESCE(SUM(p.Amount), 0) AS TotalPaid, 
             (i.TotalPrice - COALESCE(SUM(p.Amount), 0)) AS TotalBalance
      FROM Invoices i
      LEFT JOIN Payments p ON i.InvoiceId = p.InvoiceId
      GROUP BY i.InvoiceId, i.InvoiceNumber, i.CustomerName, i.CustomerAddress, i.Telephone, 
               i.FunctionDate, i.FunctionType, i.Guests, i.PlatePrice, i.TotalPrice, i.BillDetails, i.IncludeMenu, i.SelectedMenu, i.SelectedDesserts, i.SelectedBites, i.SelectedPackages,
               i.Notes, i.TotalCost, i.ProfitAmount, i.ProfitPercentage, i.CostPerPlate, i.CreatedAt
      ORDER BY i.CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve invoices" });
  }
});

// Get a single invoice details and its payment history
app.get("/api/invoices/:id", async (req, res) => {
  const invoiceId = parseInt(req.params.id);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const pool = await poolPromise;
    
    // Get invoice details
    const invoiceResult = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .query(`
        SELECT i.InvoiceId, i.InvoiceNumber, i.CustomerName, i.CustomerAddress, i.Telephone, 
               i.FunctionDate, i.FunctionType, i.Guests, i.PlatePrice, i.TotalPrice, i.BillDetails, i.IncludeMenu, i.SelectedMenu, i.SelectedDesserts, i.SelectedBites, i.SelectedPackages,
               i.Notes, i.TotalCost, i.ProfitAmount, i.ProfitPercentage, i.CostPerPlate, i.CostBreakdownJson, i.CreatedAt,
               COALESCE((SELECT SUM(Amount) FROM Payments WHERE InvoiceId = i.InvoiceId), 0) AS TotalPaid,
               (i.TotalPrice - COALESCE((SELECT SUM(Amount) FROM Payments WHERE InvoiceId = i.InvoiceId), 0)) AS TotalBalance
        FROM Invoices i
        WHERE i.InvoiceId = @InvoiceId
      `);

    if (invoiceResult.recordset.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get payments for invoice
    const paymentsResult = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .query(`
        SELECT PaymentId, ReceiptNumber, PaymentDate, Description, Amount, CreatedAt
        FROM Payments
        WHERE InvoiceId = @InvoiceId
        ORDER BY PaymentDate ASC, CreatedAt ASC
      `);

    // Get structured items for invoice
    const itemsResult = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .query(`
        SELECT ItemId, Description, Quantity, UnitPrice, Total
        FROM InvoiceItems
        WHERE InvoiceId = @InvoiceId
      `);

    const invoice = invoiceResult.recordset[0];
    invoice.payments = paymentsResult.recordset;
    invoice.items = itemsResult.recordset;

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve invoice details" });
  }
});

// Create a new invoice (auto-generates InvoiceNumber)
app.post("/api/invoices", async (req, res) => {
  const {
    customerName,
    customerAddress,
    telephone,
    functionDate,
    functionType,
    guests,
    platePrice,
    totalPrice: requestedTotalPrice,
    billDetails,
    items,
    includeMenu,
    selectedMenu,
    selectedDesserts,
    selectedBites,
    selectedPackages,
    notes,
    totalCost,
    profitAmount,
    profitPercentage,
    costPerPlate,
    costBreakdownJson
  } = req.body;

  if (!customerName || !functionDate || !functionType) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  // Parse structured items
  let invoiceItems = items || [];
  if (invoiceItems.length === 0) {
    invoiceItems = [{
      description: billDetails || "Buffet Menu",
      quantity: parseInt(guests) || 100,
      unitPrice: parseFloat(platePrice) || 3400
    }];
  }

  const numGuests = parseInt(guests) || invoiceItems[0].quantity;
  const pricePlate = parseFloat(platePrice) || invoiceItems[0].unitPrice;
  const totalPrice = requestedTotalPrice != null && !isNaN(parseFloat(requestedTotalPrice))
    ? parseFloat(requestedTotalPrice)
    : invoiceItems.reduce((sum, item) => sum + (parseInt(item.quantity) * parseFloat(item.unitPrice)), 0);
  const combinedBillDetails = invoiceItems.map(item => item.description).join("\n");
  const showMenu = includeMenu !== false ? 1 : 0;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("CustomerName", sql.NVarChar(255), customerName)
      .input("CustomerAddress", sql.NVarChar(500), customerAddress || "")
      .input("Telephone", sql.VarChar(50), telephone || "")
      .input("FunctionDate", sql.Date, functionDate)
      .input("FunctionType", sql.NVarChar(100), functionType)
      .input("Guests", sql.Int, numGuests)
      .input("PlatePrice", sql.Decimal(18, 2), pricePlate)
      .input("TotalPrice", sql.Decimal(18, 2), totalPrice)
      .input("BillDetails", sql.NVarChar(sql.MAX), combinedBillDetails)
      .input("IncludeMenu", sql.Bit, showMenu)
      .input("SelectedMenu", sql.NVarChar(sql.MAX), selectedMenu || "")
      .input("SelectedDesserts", sql.NVarChar(sql.MAX), selectedDesserts || "")
      .input("SelectedBites", sql.NVarChar(sql.MAX), selectedBites || "")
      .input("SelectedPackages", sql.NVarChar(sql.MAX), selectedPackages || "")
      .input("Notes", sql.NVarChar(sql.MAX), notes || "")
      .input("TotalCost", sql.Decimal(18, 2), parseFloat(totalCost) || 0)
      .input("ProfitAmount", sql.Decimal(18, 2), parseFloat(profitAmount) || 0)
      .input("ProfitPercentage", sql.Decimal(18, 2), parseFloat(profitPercentage) || 0)
      .input("CostPerPlate", sql.Decimal(18, 2), parseFloat(costPerPlate) || 0)
      .input("CostBreakdownJson", sql.NVarChar(sql.MAX), typeof costBreakdownJson === "string" ? costBreakdownJson : JSON.stringify(costBreakdownJson || {}))
      .query(`
        DECLARE @Year VARCHAR(4) = CAST(YEAR(GETDATE()) AS VARCHAR(4));
        DECLARE @LatestNo VARCHAR(20);
        SELECT TOP 1 @LatestNo = InvoiceNumber 
        FROM Invoices 
        WHERE InvoiceNumber LIKE 'INV-' + @Year + '-%' 
        ORDER BY InvoiceNumber DESC;
        
        DECLARE @NewSeq INT = 1;
        IF @LatestNo IS NOT NULL
        BEGIN
            SET @NewSeq = CAST(SUBSTRING(@LatestNo, 10, 4) AS INT) + 1;
        END
        
        DECLARE @InvoiceNumber VARCHAR(20) = 'INV-' + @Year + '-' + RIGHT('0000' + CAST(@NewSeq AS VARCHAR(4)), 4);
        
        INSERT INTO Invoices (InvoiceNumber, CustomerName, CustomerAddress, Telephone, FunctionDate, FunctionType, Guests, PlatePrice, TotalPrice, BillDetails, IncludeMenu, SelectedMenu, SelectedDesserts, SelectedBites, SelectedPackages, Notes, TotalCost, ProfitAmount, ProfitPercentage, CostPerPlate, CostBreakdownJson)
        VALUES (@InvoiceNumber, @CustomerName, @CustomerAddress, @Telephone, @FunctionDate, @FunctionType, @Guests, @PlatePrice, @TotalPrice, @BillDetails, @IncludeMenu, @SelectedMenu, @SelectedDesserts, @SelectedBites, @SelectedPackages, @Notes, @TotalCost, @ProfitAmount, @ProfitPercentage, @CostPerPlate, @CostBreakdownJson);
        
        SELECT SCOPE_IDENTITY() AS InvoiceId, @InvoiceNumber AS InvoiceNumber;
      `);

    const { InvoiceId, InvoiceNumber } = result.recordset[0];

    // Insert all structured items
    for (const item of invoiceItems) {
      const itemQty = parseInt(item.quantity) || 0;
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = itemQty * itemPrice;

      await pool.request()
        .input("InvoiceId", sql.Int, InvoiceId)
        .input("Description", sql.NVarChar(sql.MAX), item.description)
        .input("Quantity", sql.Int, itemQty)
        .input("UnitPrice", sql.Decimal(18, 2), itemPrice)
        .input("Total", sql.Decimal(18, 2), itemTotal)
        .query(`
          INSERT INTO InvoiceItems (InvoiceId, Description, Quantity, UnitPrice, Total)
          VALUES (@InvoiceId, @Description, @Quantity, @UnitPrice, @Total)
        `);
    }

    res.status(201).json({
      message: "Invoice created successfully",
      invoiceId: InvoiceId,
      invoiceNumber: InvoiceNumber,
      totalPrice
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// Update an existing invoice
app.put("/api/invoices/:id", async (req, res) => {
  const invoiceId = parseInt(req.params.id);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  const {
    customerName,
    customerAddress,
    telephone,
    functionDate,
    functionType,
    guests,
    platePrice,
    totalPrice: requestedTotalPrice,
    billDetails,
    items,
    includeMenu,
    selectedMenu,
    selectedDesserts,
    selectedBites,
    selectedPackages,
    notes,
    totalCost,
    profitAmount,
    profitPercentage,
    costPerPlate,
    costBreakdownJson
  } = req.body;

  if (!customerName || !functionDate || !functionType) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  // Parse structured items
  let invoiceItems = items || [];
  if (invoiceItems.length === 0) {
    invoiceItems = [{
      description: billDetails || "Buffet Menu",
      quantity: parseInt(guests) || 100,
      unitPrice: parseFloat(platePrice) || 3400
    }];
  }

  const numGuests = parseInt(guests) || invoiceItems[0].quantity;
  const pricePlate = parseFloat(platePrice) || invoiceItems[0].unitPrice;
  const totalPrice = requestedTotalPrice != null && !isNaN(parseFloat(requestedTotalPrice))
    ? parseFloat(requestedTotalPrice)
    : invoiceItems.reduce((sum, item) => sum + (parseInt(item.quantity) * parseFloat(item.unitPrice)), 0);
  const combinedBillDetails = invoiceItems.map(item => item.description).join("\n");
  const showMenu = includeMenu !== false ? 1 : 0;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .input("CustomerName", sql.NVarChar(255), customerName)
      .input("CustomerAddress", sql.NVarChar(500), customerAddress || "")
      .input("Telephone", sql.VarChar(50), telephone || "")
      .input("FunctionDate", sql.Date, functionDate)
      .input("FunctionType", sql.NVarChar(100), functionType)
      .input("Guests", sql.Int, numGuests)
      .input("PlatePrice", sql.Decimal(18, 2), pricePlate)
      .input("TotalPrice", sql.Decimal(18, 2), totalPrice)
      .input("BillDetails", sql.NVarChar(sql.MAX), combinedBillDetails)
      .input("IncludeMenu", sql.Bit, showMenu)
      .input("SelectedMenu", sql.NVarChar(sql.MAX), selectedMenu || "")
      .input("SelectedDesserts", sql.NVarChar(sql.MAX), selectedDesserts || "")
      .input("SelectedBites", sql.NVarChar(sql.MAX), selectedBites || "")
      .input("SelectedPackages", sql.NVarChar(sql.MAX), selectedPackages || "")
      .input("Notes", sql.NVarChar(sql.MAX), notes || "")
      .input("TotalCost", sql.Decimal(18, 2), parseFloat(totalCost) || 0)
      .input("ProfitAmount", sql.Decimal(18, 2), parseFloat(profitAmount) || 0)
      .input("ProfitPercentage", sql.Decimal(18, 2), parseFloat(profitPercentage) || 0)
      .input("CostPerPlate", sql.Decimal(18, 2), parseFloat(costPerPlate) || 0)
      .input("CostBreakdownJson", sql.NVarChar(sql.MAX), typeof costBreakdownJson === "string" ? costBreakdownJson : JSON.stringify(costBreakdownJson || {}))
      .query(`
        UPDATE Invoices 
        SET CustomerName = @CustomerName, 
            CustomerAddress = @CustomerAddress, 
            Telephone = @Telephone, 
            FunctionDate = @FunctionDate, 
            FunctionType = @FunctionType, 
            Guests = @Guests, 
            PlatePrice = @PlatePrice, 
            TotalPrice = @TotalPrice, 
            BillDetails = @BillDetails,
            IncludeMenu = @IncludeMenu,
            SelectedMenu = @SelectedMenu,
            SelectedDesserts = @SelectedDesserts,
            SelectedBites = @SelectedBites,
            SelectedPackages = @SelectedPackages,
            Notes = @Notes,
            TotalCost = @TotalCost,
            ProfitAmount = @ProfitAmount,
            ProfitPercentage = @ProfitPercentage,
            CostPerPlate = @CostPerPlate,
            CostBreakdownJson = @CostBreakdownJson
        WHERE InvoiceId = @InvoiceId;

        SELECT @@ROWCOUNT AS RowsUpdated;
      `);

    if (result.recordset[0].RowsUpdated === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Delete existing items
    await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .query("DELETE FROM InvoiceItems WHERE InvoiceId = @InvoiceId");

    // Re-insert structured items
    for (const item of invoiceItems) {
      const itemQty = parseInt(item.quantity) || 0;
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = itemQty * itemPrice;

      await pool.request()
        .input("InvoiceId", sql.Int, invoiceId)
        .input("Description", sql.NVarChar(sql.MAX), item.description)
        .input("Quantity", sql.Int, itemQty)
        .input("UnitPrice", sql.Decimal(18, 2), itemPrice)
        .input("Total", sql.Decimal(18, 2), itemTotal)
        .query(`
          INSERT INTO InvoiceItems (InvoiceId, Description, Quantity, UnitPrice, Total)
          VALUES (@InvoiceId, @Description, @Quantity, @UnitPrice, @Total)
        `);
    }

    res.json({ message: "Invoice updated successfully", totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// Delete an invoice
app.delete("/api/invoices/:id", async (req, res) => {
  const invoiceId = parseInt(req.params.id);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .query("DELETE FROM Invoices WHERE InvoiceId = @InvoiceId; SELECT @@ROWCOUNT AS RowsDeleted;");

    if (result.recordset[0].RowsDeleted === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// Create a new payment (receipt) for an invoice
app.post("/api/invoices/:id/payments", async (req, res) => {
  const invoiceId = parseInt(req.params.id);
  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  const { paymentDate, description, amount } = req.body;

  if (!paymentDate || !description || !amount) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  const payAmount = parseFloat(amount);

  try {
    const pool = await poolPromise;
    
    // Check if invoice exists
    const invoiceCheck = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .query("SELECT InvoiceId FROM Invoices WHERE InvoiceId = @InvoiceId");

    if (invoiceCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Insert payment and auto-generate ReceiptNumber REC-YYYY-XXXX
    const result = await pool.request()
      .input("InvoiceId", sql.Int, invoiceId)
      .input("PaymentDate", sql.Date, paymentDate)
      .input("Description", sql.NVarChar(255), description)
      .input("Amount", sql.Decimal(18, 2), payAmount)
      .query(`
        DECLARE @Year VARCHAR(4) = CAST(YEAR(GETDATE()) AS VARCHAR(4));
        DECLARE @LatestNo VARCHAR(20);
        SELECT TOP 1 @LatestNo = ReceiptNumber 
        FROM Payments 
        WHERE ReceiptNumber LIKE 'REC-' + @Year + '-%' 
        ORDER BY ReceiptNumber DESC;
        
        DECLARE @NewSeq INT = 1;
        IF @LatestNo IS NOT NULL
        BEGIN
            SET @NewSeq = CAST(SUBSTRING(@LatestNo, 10, 4) AS INT) + 1;
        END
        
        DECLARE @ReceiptNumber VARCHAR(20) = 'REC-' + @Year + '-' + RIGHT('0000' + CAST(@NewSeq AS VARCHAR(4)), 4);
        
        INSERT INTO Payments (ReceiptNumber, InvoiceId, PaymentDate, Description, Amount)
        VALUES (@ReceiptNumber, @InvoiceId, @PaymentDate, @Description, @Amount);
        
        SELECT SCOPE_IDENTITY() AS PaymentId, @ReceiptNumber AS ReceiptNumber;
      `);

    const { PaymentId, ReceiptNumber } = result.recordset[0];
    res.status(201).json({
      message: "Payment recorded successfully",
      paymentId: PaymentId,
      receiptNumber: ReceiptNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

// Delete a payment (receipt)
app.delete("/api/payments/:id", async (req, res) => {
  const paymentId = parseInt(req.params.id);
  if (isNaN(paymentId)) {
    return res.status(400).json({ error: "Invalid payment ID" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("PaymentId", sql.Int, paymentId)
      .query("DELETE FROM Payments WHERE PaymentId = @PaymentId; SELECT @@ROWCOUNT AS RowsDeleted;");

    if (result.recordset[0].RowsDeleted === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

// =========================================================================
// MASTER ITEMS / RATES CATALOG ENDPOINTS (BUFFET, PACKAGE, BITES, DESSERTS, OPERATIONS)
// =========================================================================

// List all master items
app.get("/api/master-items", async (req, res) => {
  const { category } = req.query;
  try {
    const pool = await poolPromise;
    let query = `
      SELECT ItemId, ItemName, Category, MultiplierType, BaseQuantity, Unit,
             CostPrice, SellingPrice, COALESCE(QuotationPriceType, 'cost') AS QuotationPriceType,
             IsActive, SortOrder, Notes, CreatedAt
      FROM MasterItems
    `;
    if (category) {
      query += ` WHERE Category = @Category `;
    }
    query += ` ORDER BY Category ASC, SortOrder ASC, ItemName ASC `;

    const request = pool.request();
    if (category) {
      request.input("Category", sql.VarChar(50), category);
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve master items" });
  }
});

// Create new master item
app.post("/api/master-items", async (req, res) => {
  const {
    itemName,
    category,
    multiplierType,
    baseQuantity,
    unit,
    costPrice,
    sellingPrice,
    quotationPriceType,
    notes,
    sortOrder
  } = req.body;

  if (!itemName || !category || !multiplierType) {
    return res.status(400).json({ error: "Item name, category, and multiplier type are required" });
  }

  const pType = quotationPriceType === "selling" ? "selling" : "cost";

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("ItemName", sql.NVarChar(255), itemName)
      .input("Category", sql.VarChar(50), category)
      .input("MultiplierType", sql.VarChar(50), multiplierType)
      .input("BaseQuantity", sql.Decimal(18, 2), parseFloat(baseQuantity) || 1)
      .input("Unit", sql.NVarChar(50), unit || "Kg")
      .input("CostPrice", sql.Decimal(18, 2), parseFloat(costPrice) || 0)
      .input("SellingPrice", sql.Decimal(18, 2), parseFloat(sellingPrice) || 0)
      .input("QuotationPriceType", sql.VarChar(20), pType)
      .input("Notes", sql.NVarChar(500), notes || "")
      .input("SortOrder", sql.Int, parseInt(sortOrder) || 0)
      .query(`
        INSERT INTO MasterItems (ItemName, Category, MultiplierType, BaseQuantity, Unit, CostPrice, SellingPrice, QuotationPriceType, Notes, SortOrder)
        VALUES (@ItemName, @Category, @MultiplierType, @BaseQuantity, @Unit, @CostPrice, @SellingPrice, @QuotationPriceType, @Notes, @SortOrder);
        SELECT SCOPE_IDENTITY() AS ItemId;
      `);

    res.status(201).json({
      message: "Master item created successfully",
      itemId: result.recordset[0].ItemId,
      ItemId: result.recordset[0].ItemId,
      quotationPriceType: pType
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create master item" });
  }
});

// Update master item
app.put("/api/master-items/:id", async (req, res) => {
  const itemId = parseInt(req.params.id);
  if (isNaN(itemId)) return res.status(400).json({ error: "Invalid item ID" });

  const {
    itemName,
    category,
    multiplierType,
    baseQuantity,
    unit,
    costPrice,
    sellingPrice,
    quotationPriceType,
    isActive,
    notes,
    sortOrder
  } = req.body;

  const pType = quotationPriceType === "selling" ? "selling" : "cost";

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("ItemId", sql.Int, itemId)
      .input("ItemName", sql.NVarChar(255), itemName)
      .input("Category", sql.VarChar(50), category)
      .input("MultiplierType", sql.VarChar(50), multiplierType)
      .input("BaseQuantity", sql.Decimal(18, 2), parseFloat(baseQuantity) || 1)
      .input("Unit", sql.NVarChar(50), unit || "Kg")
      .input("CostPrice", sql.Decimal(18, 2), parseFloat(costPrice) || 0)
      .input("SellingPrice", sql.Decimal(18, 2), parseFloat(sellingPrice) || 0)
      .input("QuotationPriceType", sql.VarChar(20), pType)
      .input("IsActive", sql.Bit, isActive !== false ? 1 : 0)
      .input("Notes", sql.NVarChar(500), notes || "")
      .input("SortOrder", sql.Int, parseInt(sortOrder) || 0)
      .query(`
        UPDATE MasterItems
        SET ItemName = @ItemName,
            Category = @Category,
            MultiplierType = @MultiplierType,
            BaseQuantity = @BaseQuantity,
            Unit = @Unit,
            CostPrice = @CostPrice,
            SellingPrice = @SellingPrice,
            QuotationPriceType = @QuotationPriceType,
            IsActive = @IsActive,
            Notes = @Notes,
            SortOrder = @SortOrder
        WHERE ItemId = @ItemId;
      `);

    res.json({ message: "Master item updated successfully", itemId, ItemId: itemId, quotationPriceType: pType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update master item" });
  }
});

// Quick toggle quotation price type (cost vs selling)
app.patch("/api/master-items/:id/price-type", async (req, res) => {
  const itemId = parseInt(req.params.id);
  if (isNaN(itemId)) return res.status(400).json({ error: "Invalid item ID" });

  const { quotationPriceType } = req.body;
  const pType = quotationPriceType === "selling" ? "selling" : "cost";

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("ItemId", sql.Int, itemId)
      .input("QuotationPriceType", sql.VarChar(20), pType)
      .query("UPDATE MasterItems SET QuotationPriceType = @QuotationPriceType WHERE ItemId = @ItemId;");

    res.json({ message: "Quotation price type updated successfully", itemId, quotationPriceType: pType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update quotation price type" });
  }
});

// Delete master item
app.delete("/api/master-items/:id", async (req, res) => {
  const itemId = parseInt(req.params.id);
  if (isNaN(itemId)) return res.status(400).json({ error: "Invalid item ID" });

  try {
    const pool = await poolPromise;
    await pool.request()
      .input("ItemId", sql.Int, itemId)
      .query("DELETE FROM MasterItems WHERE ItemId = @ItemId;");
    res.json({ message: "Master item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete master item" });
  }
});

// Force re-seed / reset master items from default catalog
app.post("/api/master-items/seed", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query("DELETE FROM MasterItems;");
    await seedMasterItems(pool);
    res.json({ message: "Default master items restored from Excel catalog successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to seed master items" });
  }
});

// =========================================================================
// QUOTATION ENDPOINTS (FOR LEADS)
// =========================================================================

// List all quotations
app.get("/api/quotations", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT QuotationId, QuotationNumber, LeadName, LeadAddress, Telephone, Email,
             FunctionDate, ValidUntil, FunctionType, Guests, PlatePrice, TotalPrice,
             BillDetails, IncludeMenu, SelectedMenu, SelectedDesserts, SelectedBites, SelectedPackages,
             Notes, Status, TotalCost, ProfitAmount, ProfitPercentage, CostPerPlate, CreatedAt
      FROM Quotations
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve quotations" });
  }
});

// Get single quotation details and its items
app.get("/api/quotations/:id", async (req, res) => {
  const quotationId = parseInt(req.params.id);
  if (isNaN(quotationId)) {
    return res.status(400).json({ error: "Invalid quotation ID" });
  }

  try {
    const pool = await poolPromise;
    const quoResult = await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query(`
        SELECT QuotationId, QuotationNumber, LeadName, LeadAddress, Telephone, Email,
               FunctionDate, ValidUntil, FunctionType, Guests, PlatePrice, TotalPrice,
               BillDetails, IncludeMenu, SelectedMenu, SelectedDesserts, SelectedBites, SelectedPackages,
               Notes, Status, TotalCost, ProfitAmount, ProfitPercentage, CostPerPlate, CostBreakdownJson, CreatedAt
        FROM Quotations
        WHERE QuotationId = @QuotationId
      `);

    if (quoResult.recordset.length === 0) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    const itemsResult = await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query(`
        SELECT ItemId, Description, Quantity, UnitPrice, Total
        FROM QuotationItems
        WHERE QuotationId = @QuotationId
      `);

    const quotation = quoResult.recordset[0];
    quotation.items = itemsResult.recordset;

    res.json(quotation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve quotation details" });
  }
});

// Create a new quotation (auto-generates QuotationNumber QUO-YYYY-XXXX)
app.post("/api/quotations", async (req, res) => {
  const {
    leadName,
    leadAddress,
    telephone,
    email,
    functionDate,
    validUntil,
    functionType,
    guests,
    platePrice,
    billDetails,
    items,
    includeMenu,
    selectedMenu,
    selectedDesserts,
    selectedBites,
    selectedPackages,
    notes,
    status,
    totalCost,
    profitAmount,
    profitPercentage,
    costPerPlate,
    costBreakdownJson
  } = req.body;

  if (!leadName || !functionType) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  let quotationItems = items || [];
  if (quotationItems.length === 0) {
    quotationItems = [{
      description: billDetails || "Buffet Menu",
      quantity: parseInt(guests) || 100,
      unitPrice: parseFloat(platePrice) || 3400
    }];
  }

  const numGuests = parseInt(quotationItems[0].quantity) || 0;
  const pricePlate = parseFloat(quotationItems[0].unitPrice) || 0;
  const totalPrice = quotationItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  const combinedBillDetails = quotationItems.map(item => item.description).join("\n");
  const showMenu = includeMenu !== false ? 1 : 0;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("LeadName", sql.NVarChar(255), leadName)
      .input("LeadAddress", sql.NVarChar(500), leadAddress || "")
      .input("Telephone", sql.VarChar(50), telephone || "")
      .input("Email", sql.NVarChar(255), email || "")
      .input("FunctionDate", sql.Date, functionDate || null)
      .input("ValidUntil", sql.Date, validUntil || null)
      .input("FunctionType", sql.NVarChar(100), functionType)
      .input("Guests", sql.Int, numGuests)
      .input("PlatePrice", sql.Decimal(18, 2), pricePlate)
      .input("TotalPrice", sql.Decimal(18, 2), totalPrice)
      .input("BillDetails", sql.NVarChar(sql.MAX), combinedBillDetails)
      .input("IncludeMenu", sql.Bit, showMenu)
      .input("SelectedMenu", sql.NVarChar(sql.MAX), selectedMenu || "")
      .input("SelectedDesserts", sql.NVarChar(sql.MAX), selectedDesserts || "")
      .input("SelectedBites", sql.NVarChar(sql.MAX), selectedBites || "")
      .input("SelectedPackages", sql.NVarChar(sql.MAX), selectedPackages || "")
      .input("Notes", sql.NVarChar(sql.MAX), notes || "")
      .input("Status", sql.VarChar(50), status || "Sent")
      .input("TotalCost", sql.Decimal(18, 2), parseFloat(totalCost) || 0)
      .input("ProfitAmount", sql.Decimal(18, 2), parseFloat(profitAmount) || 0)
      .input("ProfitPercentage", sql.Decimal(18, 2), parseFloat(profitPercentage) || 0)
      .input("CostPerPlate", sql.Decimal(18, 2), parseFloat(costPerPlate) || 0)
      .input("CostBreakdownJson", sql.NVarChar(sql.MAX), typeof costBreakdownJson === "string" ? costBreakdownJson : JSON.stringify(costBreakdownJson || {}))
      .query(`
        DECLARE @Year VARCHAR(4) = CAST(YEAR(GETDATE()) AS VARCHAR(4));
        DECLARE @LatestNo VARCHAR(20);
        SELECT TOP 1 @LatestNo = QuotationNumber
        FROM Quotations
        WHERE QuotationNumber LIKE 'QUO-' + @Year + '-%'
        ORDER BY QuotationNumber DESC;

        DECLARE @NewSeq INT = 1;
        IF @LatestNo IS NOT NULL
        BEGIN
            SET @NewSeq = CAST(SUBSTRING(@LatestNo, 10, 4) AS INT) + 1;
        END

        DECLARE @QuotationNumber VARCHAR(20) = 'QUO-' + @Year + '-' + RIGHT('0000' + CAST(@NewSeq AS VARCHAR(4)), 4);

        INSERT INTO Quotations (
          QuotationNumber, LeadName, LeadAddress, Telephone, Email,
          FunctionDate, ValidUntil, FunctionType, Guests, PlatePrice, TotalPrice,
          BillDetails, IncludeMenu, SelectedMenu, SelectedDesserts, SelectedBites, SelectedPackages,
          Notes, Status, TotalCost, ProfitAmount, ProfitPercentage, CostPerPlate, CostBreakdownJson
        )
        VALUES (
          @QuotationNumber, @LeadName, @LeadAddress, @Telephone, @Email,
          @FunctionDate, @ValidUntil, @FunctionType, @Guests, @PlatePrice, @TotalPrice,
          @BillDetails, @IncludeMenu, @SelectedMenu, @SelectedDesserts, @SelectedBites, @SelectedPackages,
          @Notes, @Status, @TotalCost, @ProfitAmount, @ProfitPercentage, @CostPerPlate, @CostBreakdownJson
        );

        SELECT SCOPE_IDENTITY() AS QuotationId, @QuotationNumber AS QuotationNumber;
      `);

    const { QuotationId, QuotationNumber } = result.recordset[0];

    for (const item of quotationItems) {
      const itemQty = parseInt(item.quantity) || 0;
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = itemQty * itemPrice;

      await pool.request()
        .input("QuotationId", sql.Int, QuotationId)
        .input("Description", sql.NVarChar(sql.MAX), item.description)
        .input("Quantity", sql.Int, itemQty)
        .input("UnitPrice", sql.Decimal(18, 2), itemPrice)
        .input("Total", sql.Decimal(18, 2), itemTotal)
        .query(`
          INSERT INTO QuotationItems (QuotationId, Description, Quantity, UnitPrice, Total)
          VALUES (@QuotationId, @Description, @Quantity, @UnitPrice, @Total)
        `);
    }

    res.status(201).json({
      message: "Quotation created successfully",
      quotationId: QuotationId,
      quotationNumber: QuotationNumber,
      QuotationId,
      QuotationNumber,
      totalPrice
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create quotation" });
  }
});

// Update an existing quotation
app.put("/api/quotations/:id", async (req, res) => {
  const quotationId = parseInt(req.params.id);
  if (isNaN(quotationId)) {
    return res.status(400).json({ error: "Invalid quotation ID" });
  }

  const {
    leadName,
    leadAddress,
    telephone,
    email,
    functionDate,
    validUntil,
    functionType,
    guests,
    platePrice,
    billDetails,
    items,
    includeMenu,
    selectedMenu,
    selectedDesserts,
    selectedBites,
    selectedPackages,
    notes,
    status,
    totalCost,
    profitAmount,
    profitPercentage,
    costPerPlate,
    costBreakdownJson
  } = req.body;

  if (!leadName || !functionType) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  let quotationItems = items || [];
  if (quotationItems.length === 0) {
    quotationItems = [{
      description: billDetails || "Buffet Menu",
      quantity: parseInt(guests) || 100,
      unitPrice: parseFloat(platePrice) || 3400
    }];
  }

  const numGuests = parseInt(quotationItems[0].quantity) || 0;
  const pricePlate = parseFloat(quotationItems[0].unitPrice) || 0;
  const totalPrice = quotationItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  const combinedBillDetails = quotationItems.map(item => item.description).join("\n");
  const showMenu = includeMenu !== false ? 1 : 0;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .input("LeadName", sql.NVarChar(255), leadName)
      .input("LeadAddress", sql.NVarChar(500), leadAddress || "")
      .input("Telephone", sql.VarChar(50), telephone || "")
      .input("Email", sql.NVarChar(255), email || "")
      .input("FunctionDate", sql.Date, functionDate || null)
      .input("ValidUntil", sql.Date, validUntil || null)
      .input("FunctionType", sql.NVarChar(100), functionType)
      .input("Guests", sql.Int, numGuests)
      .input("PlatePrice", sql.Decimal(18, 2), pricePlate)
      .input("TotalPrice", sql.Decimal(18, 2), totalPrice)
      .input("BillDetails", sql.NVarChar(sql.MAX), combinedBillDetails)
      .input("IncludeMenu", sql.Bit, showMenu)
      .input("SelectedMenu", sql.NVarChar(sql.MAX), selectedMenu || "")
      .input("SelectedDesserts", sql.NVarChar(sql.MAX), selectedDesserts || "")
      .input("SelectedBites", sql.NVarChar(sql.MAX), selectedBites || "")
      .input("SelectedPackages", sql.NVarChar(sql.MAX), selectedPackages || "")
      .input("Notes", sql.NVarChar(sql.MAX), notes || "")
      .input("Status", sql.VarChar(50), status || "Sent")
      .input("TotalCost", sql.Decimal(18, 2), parseFloat(totalCost) || 0)
      .input("ProfitAmount", sql.Decimal(18, 2), parseFloat(profitAmount) || 0)
      .input("ProfitPercentage", sql.Decimal(18, 2), parseFloat(profitPercentage) || 0)
      .input("CostPerPlate", sql.Decimal(18, 2), parseFloat(costPerPlate) || 0)
      .input("CostBreakdownJson", sql.NVarChar(sql.MAX), typeof costBreakdownJson === "string" ? costBreakdownJson : JSON.stringify(costBreakdownJson || {}))
      .query(`
        UPDATE Quotations
        SET LeadName = @LeadName,
            LeadAddress = @LeadAddress,
            Telephone = @Telephone,
            Email = @Email,
            FunctionDate = @FunctionDate,
            ValidUntil = @ValidUntil,
            FunctionType = @FunctionType,
            Guests = @Guests,
            PlatePrice = @PlatePrice,
            TotalPrice = @TotalPrice,
            BillDetails = @BillDetails,
            IncludeMenu = @IncludeMenu,
            SelectedMenu = @SelectedMenu,
            SelectedDesserts = @SelectedDesserts,
            SelectedBites = @SelectedBites,
            SelectedPackages = @SelectedPackages,
            Notes = @Notes,
            Status = @Status,
            TotalCost = @TotalCost,
            ProfitAmount = @ProfitAmount,
            ProfitPercentage = @ProfitPercentage,
            CostPerPlate = @CostPerPlate,
            CostBreakdownJson = @CostBreakdownJson
        WHERE QuotationId = @QuotationId;

        SELECT @@ROWCOUNT AS RowsUpdated;
      `);

    if (result.recordset[0].RowsUpdated === 0) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query("DELETE FROM QuotationItems WHERE QuotationId = @QuotationId");

    for (const item of quotationItems) {
      const itemQty = parseInt(item.quantity) || 0;
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemTotal = itemQty * itemPrice;

      await pool.request()
        .input("QuotationId", sql.Int, quotationId)
        .input("Description", sql.NVarChar(sql.MAX), item.description)
        .input("Quantity", sql.Int, itemQty)
        .input("UnitPrice", sql.Decimal(18, 2), itemPrice)
        .input("Total", sql.Decimal(18, 2), itemTotal)
        .query(`
          INSERT INTO QuotationItems (QuotationId, Description, Quantity, UnitPrice, Total)
          VALUES (@QuotationId, @Description, @Quantity, @UnitPrice, @Total)
        `);
    }

    res.json({ message: "Quotation updated successfully", quotationId, QuotationId: quotationId, totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update quotation" });
  }
});

// Delete a quotation
app.delete("/api/quotations/:id", async (req, res) => {
  const quotationId = parseInt(req.params.id);
  if (isNaN(quotationId)) {
    return res.status(400).json({ error: "Invalid quotation ID" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query("DELETE FROM Quotations WHERE QuotationId = @QuotationId; SELECT @@ROWCOUNT AS RowsDeleted;");

    if (result.recordset[0].RowsDeleted === 0) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    res.json({ message: "Quotation deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete quotation" });
  }
});

// Convert a quotation into an invoice
app.post("/api/quotations/:id/convert", async (req, res) => {
  const quotationId = parseInt(req.params.id);
  if (isNaN(quotationId)) {
    return res.status(400).json({ error: "Invalid quotation ID" });
  }

  try {
    const pool = await poolPromise;
    const quoResult = await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query("SELECT * FROM Quotations WHERE QuotationId = @QuotationId");

    if (quoResult.recordset.length === 0) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    const quo = quoResult.recordset[0];
    const itemsResult = await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query("SELECT * FROM QuotationItems WHERE QuotationId = @QuotationId");

    const invResult = await pool.request()
      .input("CustomerName", sql.NVarChar(255), quo.LeadName)
      .input("CustomerAddress", sql.NVarChar(500), quo.LeadAddress || "")
      .input("Telephone", sql.VarChar(50), quo.Telephone || "")
      .input("FunctionDate", sql.Date, quo.FunctionDate || new Date())
      .input("FunctionType", sql.NVarChar(100), quo.FunctionType)
      .input("Guests", sql.Int, quo.Guests)
      .input("PlatePrice", sql.Decimal(18, 2), quo.PlatePrice)
      .input("TotalPrice", sql.Decimal(18, 2), quo.TotalPrice)
      .input("BillDetails", sql.NVarChar(sql.MAX), quo.BillDetails || "")
      .input("IncludeMenu", sql.Bit, quo.IncludeMenu)
      .input("SelectedMenu", sql.NVarChar(sql.MAX), quo.SelectedMenu || "")
      .input("SelectedDesserts", sql.NVarChar(sql.MAX), quo.SelectedDesserts || "")
      .input("SelectedBites", sql.NVarChar(sql.MAX), quo.SelectedBites || "")
      .input("SelectedPackages", sql.NVarChar(sql.MAX), quo.SelectedPackages || "")
      .input("Notes", sql.NVarChar(sql.MAX), quo.Notes || "")
      .input("TotalCost", sql.Decimal(18, 2), quo.TotalCost || 0)
      .input("ProfitAmount", sql.Decimal(18, 2), quo.ProfitAmount || 0)
      .input("ProfitPercentage", sql.Decimal(18, 2), quo.ProfitPercentage || 25.0)
      .input("CostPerPlate", sql.Decimal(18, 2), quo.CostPerPlate || 0)
      .input("CostBreakdownJson", sql.NVarChar(sql.MAX), quo.CostBreakdownJson || "[]")
      .query(`
        DECLARE @Year VARCHAR(4) = CAST(YEAR(GETDATE()) AS VARCHAR(4));
        DECLARE @LatestNo VARCHAR(20);
        SELECT TOP 1 @LatestNo = InvoiceNumber
        FROM Invoices
        WHERE InvoiceNumber LIKE 'INV-' + @Year + '-%'
        ORDER BY InvoiceNumber DESC;

        DECLARE @NewSeq INT = 1;
        IF @LatestNo IS NOT NULL
        BEGIN
            SET @NewSeq = CAST(SUBSTRING(@LatestNo, 10, 4) AS INT) + 1;
        END

        DECLARE @InvoiceNumber VARCHAR(20) = 'INV-' + @Year + '-' + RIGHT('0000' + CAST(@NewSeq AS VARCHAR(4)), 4);

        INSERT INTO Invoices (InvoiceNumber, CustomerName, CustomerAddress, Telephone, FunctionDate, FunctionType, Guests, PlatePrice, TotalPrice, BillDetails, IncludeMenu, SelectedMenu, SelectedDesserts, SelectedBites, SelectedPackages, Notes, TotalCost, ProfitAmount, ProfitPercentage, CostPerPlate, CostBreakdownJson)
        VALUES (@InvoiceNumber, @CustomerName, @CustomerAddress, @Telephone, @FunctionDate, @FunctionType, @Guests, @PlatePrice, @TotalPrice, @BillDetails, @IncludeMenu, @SelectedMenu, @SelectedDesserts, @SelectedBites, @SelectedPackages, @Notes, @TotalCost, @ProfitAmount, @ProfitPercentage, @CostPerPlate, @CostBreakdownJson);

        SELECT SCOPE_IDENTITY() AS InvoiceId, @InvoiceNumber AS InvoiceNumber;
      `);

    const { InvoiceId, InvoiceNumber } = invResult.recordset[0];

    for (const item of itemsResult.recordset) {
      await pool.request()
        .input("InvoiceId", sql.Int, InvoiceId)
        .input("Description", sql.NVarChar(sql.MAX), item.Description)
        .input("Quantity", sql.Int, item.Quantity)
        .input("UnitPrice", sql.Decimal(18, 2), item.UnitPrice)
        .input("Total", sql.Decimal(18, 2), item.Total)
        .query(`
          INSERT INTO InvoiceItems (InvoiceId, Description, Quantity, UnitPrice, Total)
          VALUES (@InvoiceId, @Description, @Quantity, @UnitPrice, @Total)
        `);
    }

    await pool.request()
      .input("QuotationId", sql.Int, quotationId)
      .query("UPDATE Quotations SET Status = 'Accepted' WHERE QuotationId = @QuotationId");

    res.status(201).json({
      message: "Quotation converted to invoice successfully",
      invoiceId: InvoiceId,
      invoiceNumber: InvoiceNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to convert quotation to invoice" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
