import { describe, it, expect } from "vitest";
import { MenuService } from "./menu";
import { GoogleAuth } from "google-auth-library";

// MenuService is instantiated with a GoogleAuth, but parsing methods are pure —
// no Google API calls are made in these tests.
const service = new MenuService({} as GoogleAuth);

const HEADER_ROW = ["Title", "description", "Price_1_description", "Price_1", "Price_2_description", "Price_2", "ImageUrl", "Ingredients"];

describe("MenuService.parseMenuItems (legacy flat format)", () => {
  it("parseMenuItems_ShouldReturnEmptyArray_WhenOnlyHeaderRowProvided", () => {
    const result = service.parseMenuItems([HEADER_ROW]);
    expect(result).toEqual([]);
  });

  it("parseMenuItems_ShouldMapAllFields_WhenRowIsComplete", () => {
    const rows = [
      HEADER_ROW,
      ["Burger", "Juicy beef burger", "Single", "8.99", "Double", "14.99", "https://example.com/burger.jpg", "Beef patty, bun, lettuce, tomato"],
    ];
    const result = service.parseMenuItems(rows);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: "Burger",
      description: "Juicy beef burger",
      price1Description: "Single",
      price1: "8.99",
      price2Description: "Double",
      price2: "14.99",
      imageUrl: "https://example.com/burger.jpg",
      ingredients: "Beef patty, bun, lettuce, tomato",
    });
  });

  it("parseMenuItems_ShouldOmitOptionalPriceFields_WhenPrice2ColumnsAreEmpty", () => {
    const rows = [
      HEADER_ROW,
      ["Pizza", "Margherita pizza", "Slice", "3.50", "", "", "https://example.com/pizza.jpg"],
    ];
    const result = service.parseMenuItems(rows);
    expect(result[0].price2Description).toBeUndefined();
    expect(result[0].price2).toBeUndefined();
  });

  it("parseMenuItems_ShouldSkipBlankRows_WhenTitleIsEmpty", () => {
    const rows = [
      HEADER_ROW,
      ["", "no title row", "Price", "5.00", "", "", ""],
      ["Salad", "Fresh salad", "Small", "4.00", "", "", "https://example.com/salad.jpg"],
    ];
    const result = service.parseMenuItems(rows);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Salad");
  });

  it("parseMenuItems_ShouldTrimWhitespace_WhenCellsHaveLeadingOrTrailingSpaces", () => {
    const rows = [
      HEADER_ROW,
      ["  Burger  ", "  Juicy  ", "  Single  ", "  8.99  ", "", "", "  https://example.com/burger.jpg  "],
    ];
    const result = service.parseMenuItems(rows);
    expect(result[0].title).toBe("Burger");
    expect(result[0].description).toBe("Juicy");
    expect(result[0].price1Description).toBe("Single");
    expect(result[0].price1).toBe("8.99");
    expect(result[0].imageUrl).toBe("https://example.com/burger.jpg");
  });

  it("parseMenuItems_ShouldHandleMissingOptionalColumns_WhenRowHasFewerThan7Cells", () => {
    const rows = [
      HEADER_ROW,
      ["Soup", "Hot soup", "Bowl", "5.00"],
    ];
    const result = service.parseMenuItems(rows);
    expect(result[0].price2Description).toBeUndefined();
    expect(result[0].price2).toBeUndefined();
    expect(result[0].imageUrl).toBe("");
  });

  it("parseMenuItems_ShouldReturnMultipleItems_WhenMultipleDataRowsProvided", () => {
    const rows = [
      HEADER_ROW,
      ["Burger", "Beef burger", "Single", "8.99", "", "", "https://example.com/burger.jpg"],
      ["Pizza", "Margherita", "Slice", "3.50", "Whole", "18.00", "https://example.com/pizza.jpg"],
      ["Salad", "Fresh salad", "Small", "4.00", "Large", "7.00", "https://example.com/salad.jpg"],
    ];
    const result = service.parseMenuItems(rows);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Burger");
    expect(result[1].title).toBe("Pizza");
    expect(result[2].title).toBe("Salad");
  });

  it("parseMenuItems_ShouldIncludeIngredients_WhenRow7IsPresent", () => {
    const rows = [
      HEADER_ROW,
      ["Burger", "Beef burger", "Single", "8.99", "", "", "https://example.com/burger.jpg", "  Beef, bun, lettuce  "],
    ];
    const result = service.parseMenuItems(rows);
    expect(result[0].ingredients).toBe("Beef, bun, lettuce");
  });

  it("parseMenuItems_ShouldSetIngredientsToUndefined_WhenRow7IsEmpty", () => {
    const rows = [
      HEADER_ROW,
      ["Burger", "Beef burger", "Single", "8.99", "", "", "https://example.com/burger.jpg", ""],
    ];
    const result = service.parseMenuItems(rows);
    expect(result[0].ingredients).toBeUndefined();
  });

  it("parseMenuItems_ShouldSetIngredientsToUndefined_WhenRowHasFewerThan8Cells", () => {
    const rows = [
      HEADER_ROW,
      ["Burger", "Beef burger", "Single", "8.99", "", "", "https://example.com/burger.jpg"],
    ];
    const result = service.parseMenuItems(rows);
    expect(result[0].ingredients).toBeUndefined();
  });
});

describe("MenuService.parseMenuSections", () => {
  it("parseMenuSections_ShouldReturnEmptyArray_WhenInputIsEmpty", () => {
    const result = service.parseMenuSections([]);
    expect(result).toEqual([]);
  });

  it("parseMenuSections_ShouldReturnOneSectionWithItems_WhenSheetHasOneSectionHeader", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      ["Soup", "Hot soup", "Bowl", "5.00", "", "", "https://example.com/soup.jpg"],
      ["Salad", "Fresh salad", "Small", "4.00", "", "", "https://example.com/salad.jpg"],
    ];
    const result = service.parseMenuSections(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Starters");
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items[0].title).toBe("Soup");
    expect(result[0].items[1].title).toBe("Salad");
  });

  it("parseMenuSections_ShouldReturnMultipleSections_WhenSheetHasMultipleSectionHeaders", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      ["Soup", "Hot soup", "Bowl", "5.00", "", "", ""],
      [],
      ["Main dishes"],
      HEADER_ROW,
      ["Burger", "Juicy beef", "Single", "8.99", "", "", ""],
    ];
    const result = service.parseMenuSections(rows);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Starters");
    expect(result[1].name).toBe("Main dishes");
  });

  it("parseMenuSections_ShouldSkipEmptyRows_WhenRowsAreBlank", () => {
    const rows = [
      [],
      ["Starters"],
      HEADER_ROW,
      ["Soup", "Hot soup", "Bowl", "5.00", "", "", ""],
      [],
      [],
    ];
    const result = service.parseMenuSections(rows);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
  });

  it("parseMenuSections_ShouldMapAllItemFields_WhenDataRowIsComplete", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      ["Burger", "Juicy beef burger", "Single", "8.99", "Double", "14.99", "https://example.com/burger.jpg", "Beef patty, bun, lettuce, tomato"],
    ];
    const result = service.parseMenuSections(rows);
    expect(result[0].items[0]).toEqual({
      title: "Burger",
      description: "Juicy beef burger",
      price1Description: "Single",
      price1: "8.99",
      price2Description: "Double",
      price2: "14.99",
      imageUrl: "https://example.com/burger.jpg",
      ingredients: "Beef patty, bun, lettuce, tomato",
    });
  });

  it("parseMenuSections_ShouldOmitOptionalPriceFields_WhenPrice2ColumnsAreEmpty", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      ["Pizza", "Margherita pizza", "Slice", "3.50", "", "", "https://example.com/pizza.jpg"],
    ];
    const result = service.parseMenuSections(rows);
    expect(result[0].items[0].price2Description).toBeUndefined();
    expect(result[0].items[0].price2).toBeUndefined();
  });

  it("parseMenuSections_ShouldSetIngredientsToUndefined_WhenIngredientColumnIsEmpty", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      ["Soup", "Hot soup", "Bowl", "5.00", "", "", "https://example.com/soup.jpg", ""],
    ];
    const result = service.parseMenuSections(rows);
    expect(result[0].items[0].ingredients).toBeUndefined();
  });

  it("parseMenuSections_ShouldNotIncludeEmptySections_WhenSectionHasNoDataRows", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      [],
      ["Main dishes"],
      HEADER_ROW,
      ["Burger", "Juicy beef", "Single", "8.99", "", "", ""],
    ];
    const result = service.parseMenuSections(rows);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Main dishes");
  });

  it("parseMenuSections_ShouldTrimWhitespace_WhenCellsHaveLeadingOrTrailingSpaces", () => {
    const rows = [
      ["  Starters  "],
      HEADER_ROW,
      ["  Soup  ", "  Hot soup  ", "  Bowl  ", "  5.00  ", "", "", "  https://example.com/soup.jpg  "],
    ];
    const result = service.parseMenuSections(rows);
    expect(result[0].name).toBe("Starters");
    expect(result[0].items[0].title).toBe("Soup");
    expect(result[0].items[0].description).toBe("Hot soup");
    expect(result[0].items[0].price1).toBe("5.00");
    expect(result[0].items[0].imageUrl).toBe("https://example.com/soup.jpg");
  });

  it("parseMenuSections_ShouldAssignItemsToCorrectSection_WhenMultipleSectionsHaveItems", () => {
    const rows = [
      ["Starters"],
      HEADER_ROW,
      ["Soup", "Hot soup", "Bowl", "5.00", "", "", ""],
      ["Salad", "Fresh salad", "Small", "4.00", "", "", ""],
      [],
      ["Main dishes"],
      HEADER_ROW,
      ["Burger", "Juicy beef", "Single", "8.99", "", "", ""],
      ["Pizza", "Margherita", "Slice", "3.50", "Whole", "18.00", ""],
    ];
    const result = service.parseMenuSections(rows);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Starters");
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items[0].title).toBe("Soup");
    expect(result[0].items[1].title).toBe("Salad");
    expect(result[1].name).toBe("Main dishes");
    expect(result[1].items).toHaveLength(2);
    expect(result[1].items[0].title).toBe("Burger");
    expect(result[1].items[1].title).toBe("Pizza");
  });

  it("parseMenuSections_ShouldSkipHeaderRows_WhenRowStartsWithTitle", () => {
    const rows = [
      ["Drinks"],
      ["Title", "Description", "Price_1_description", "Price_1", "Price_2_description", "Price_2", "ImageUrl", "Ingredients"],
      ["Water", "Still water", "Small", "1.50", "Large", "2.50", ""],
    ];
    const result = service.parseMenuSections(rows);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].title).toBe("Water");
  });
});

describe("MenuService.columnIndexToLetter", () => {
  const svc = service as any;

  it("columnIndexToLetter_ShouldReturnA_WhenIndexIsZero", () => {
    expect(svc.columnIndexToLetter(0)).toBe("A");
  });

  it("columnIndexToLetter_ShouldReturnH_WhenIndexIsSeven", () => {
    expect(svc.columnIndexToLetter(7)).toBe("H");
  });

  it("columnIndexToLetter_ShouldReturnZ_WhenIndexIsTwentyFive", () => {
    expect(svc.columnIndexToLetter(25)).toBe("Z");
  });

  it("columnIndexToLetter_ShouldReturnAA_WhenIndexIsTwentySix", () => {
    expect(svc.columnIndexToLetter(26)).toBe("AA");
  });

  it("columnIndexToLetter_ShouldReturnAZ_WhenIndexIsFiftyOne", () => {
    expect(svc.columnIndexToLetter(51)).toBe("AZ");
  });
});

describe("MenuService.tableRangeToA1", () => {
  const svc = service as any;

  it("tableRangeToA1_ShouldReturnCorrectA1Range_WhenTableStartsAtTopLeft", () => {
    const table = { startRowIndex: 0, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 8 };
    expect(svc.tableRangeToA1("Menu", table)).toBe("Menu!A1:H5");
  });

  it("tableRangeToA1_ShouldReturnCorrectA1Range_WhenTableStartsAtOffset", () => {
    // e.g. table header at row 4 (0-indexed), data rows 5-10, 8 columns
    const table = { startRowIndex: 4, endRowIndex: 10, startColumnIndex: 0, endColumnIndex: 8 };
    expect(svc.tableRangeToA1("Menu", table)).toBe("Menu!A5:H10");
  });

  it("tableRangeToA1_ShouldIncludeSheetName_WhenSheetNameProvided", () => {
    const table = { startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 8 };
    expect(svc.tableRangeToA1("Menu", table)).toContain("Menu!");
  });
});
