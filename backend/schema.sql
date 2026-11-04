-- Create Invoices Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
BEGIN
    CREATE TABLE Invoices (
        InvoiceId INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceNumber VARCHAR(20) UNIQUE NOT NULL,
        CustomerName NVARCHAR(255) NOT NULL,
        CustomerAddress NVARCHAR(500),
        Telephone VARCHAR(50),
        FunctionDate DATE NOT NULL,
        FunctionType NVARCHAR(100) NOT NULL, -- e.g., 'Day function', 'Wedding Date :Day function'
        Guests INT NOT NULL,
        PlatePrice DECIMAL(18, 2) NOT NULL,
        TotalPrice DECIMAL(18, 2) NOT NULL,
        BillDetails NVARCHAR(MAX),
        IncludeMenu BIT DEFAULT 1,
        SelectedMenu NVARCHAR(MAX),
        SelectedDesserts NVARCHAR(MAX),
        SelectedBites NVARCHAR(MAX),
        SelectedPackages NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Create Payments Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
BEGIN
    CREATE TABLE Payments (
        PaymentId INT IDENTITY(1,1) PRIMARY KEY,
        ReceiptNumber VARCHAR(20) UNIQUE,
        InvoiceId INT NOT NULL FOREIGN KEY REFERENCES Invoices(InvoiceId) ON DELETE CASCADE,
        PaymentDate DATE NOT NULL,
        Description NVARCHAR(255) NOT NULL, -- e.g., 'Advanced Payment', 'Second Payment', 'Final Balance'
        Amount DECIMAL(18, 2) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Create InvoiceItems Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceItems')
BEGIN
    CREATE TABLE InvoiceItems (
        ItemId INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceId INT NOT NULL FOREIGN KEY REFERENCES Invoices(InvoiceId) ON DELETE CASCADE,
        Description NVARCHAR(MAX) NOT NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18, 2) NOT NULL,
        Total DECIMAL(18, 2) NOT NULL
    );
END

-- Create Quotations Table
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
        SelectedDesserts NVARCHAR(MAX),
        SelectedBites NVARCHAR(MAX),
        SelectedPackages NVARCHAR(MAX),
        Notes NVARCHAR(MAX),
        Status VARCHAR(50) DEFAULT 'Sent',
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

-- Create QuotationItems Table
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

-- Create MasterItems Table (For Buffet items, Package items, Bites, Desserts, Operations)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MasterItems')
BEGIN
    CREATE TABLE MasterItems (
        ItemId INT IDENTITY(1,1) PRIMARY KEY,
        ItemName NVARCHAR(255) NOT NULL,
        Category VARCHAR(50) NOT NULL, -- 'buffet', 'package', 'bites', 'dessert', 'operations'
        MultiplierType VARCHAR(50) NOT NULL, -- 'per_guest', 'fixed', 'bites_200', 'staff_200'
        BaseQuantity DECIMAL(18, 2) DEFAULT 1, -- Base qty (e.g. for 200 guests in bites/staff)
        Unit NVARCHAR(50) DEFAULT 'Kg', -- 'Kg', 'Pcs', 'Plate', 'Service', 'Person'
        CostPrice DECIMAL(18, 2) NOT NULL DEFAULT 0,
        SellingPrice DECIMAL(18, 2) NOT NULL DEFAULT 0,
        QuotationPriceType VARCHAR(20) DEFAULT 'cost', -- 'cost' or 'selling' (basis used when creating quotation)
        IsActive BIT DEFAULT 1,
        SortOrder INT DEFAULT 0,
        Notes NVARCHAR(500),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('MasterItems') AND name = 'QuotationPriceType')
BEGIN
    ALTER TABLE MasterItems ADD QuotationPriceType VARCHAR(20) DEFAULT 'cost';
END

-- Add Costing & Profit columns to Quotations if not present
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
