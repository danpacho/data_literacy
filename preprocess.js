import * as fs from "fs";
import json2csv from "json2csv";
import * as XLSX from "xlsx"; // Add this line to import SheetJS

const extractJson = (filePath) => {
  const file = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(file);
  return json;
};

const writeJson = (filePath, json) => {
  const jsonString = JSON.stringify(json, null, 2);
  fs.writeFileSync(filePath, jsonString);

  return filePath;
};

const flattenKeys = (record) => {
  const flatten = (obj, prefix = "") =>
    Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + "." : "";
      if (typeof obj[k] === "object" && obj[k] !== null) {
        Object.assign(acc, flatten(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});

  return flatten(record);
};

const extractDBFileLists = (dbRoot) => {
  const dbFileNames = fs.readdirSync(dbRoot);
  const dbFilePaths = dbFileNames.map((fileName) => `${dbRoot}/${fileName}`);

  return dbFilePaths;
};

const extractFieldNames = (records) => {
  const uniqueKeys = new Set();
  records.forEach((record) => {
    const keys = Object.keys(record.data);
    keys.map((key) => uniqueKeys.add(key));
  });
  const res = Array.from(uniqueKeys);
  res.sort();
  return res;
};

const processProfit = () => {
  const dbRoot = "./db/profit";
  const dbFilePaths = extractDBFileLists(dbRoot);
  const dbRecords = dbFilePaths.map(extractJson);
  const flattenedRecords = dbRecords.map((e) => flattenKeys(e));

  const finalProfitRecord = flattenedRecords.map((e, i) => {
    const key = dbFilePaths[i].split("_")[0].split("/")[3];
    return {
      type: key,
      data: e,
    };
  });
  writeJson("./db/profit.json", finalProfitRecord);

  const uniqueKeys = extractFieldNames(finalProfitRecord);
  writeJson("./db/fieldNames.json", uniqueKeys);

  return finalProfitRecord;
};

const processPopulations = () => {
  const dbRoot = "./db/populations";
  const dbFilePaths = extractDBFileLists(dbRoot);
  const dbRecords = dbFilePaths.map(extractJson);
  const flattenedRecords = dbRecords.map((e) => flattenKeys(e));

  const finalPopulationRecord = flattenedRecords.map((e, i) => {
    const key = dbFilePaths[i].split("_")[0].split("/")[3];
    return {
      type: key,
      data: e,
    };
  });
  writeJson("./db/populations.json", finalPopulationRecord);

  const uniqueKeys = extractFieldNames(finalPopulationRecord);
  writeJson("./db/fieldNames.json", uniqueKeys);

  return finalPopulationRecord;
};

const jsonToCsv = (fields, data, filename) => {
  // Map the data rows to ensure that each row only includes fields from `fields`
  const csvData = data.map((row) => {
    const rowData = {};
    fields.forEach((field) => {
      rowData[field] = row[field] || 0; // Fill with empty string if field is missing
    });
    return rowData;
  });

  // Convert to CSV using json2csv with the specified fields
  const parser = new json2csv.Parser({ fields });
  const csv = parser.parse(csvData);

  // Write the CSV to the specified file
  fs.writeFileSync(filename, csv);
};

const csvToXlsx = (csvFilePath, xlsxFilePath) => {
  const csvData = fs.readFileSync(csvFilePath, "utf8");

  // Split CSV data into rows and map into an array of arrays
  const rows = csvData
    .trim()
    .split("\n")
    .map((row) => row.split(","));

  const worksheet = XLSX.utils.aoa_to_sheet(rows); // Create worksheet from 2D array
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "data");
  XLSX.writeFile(workbook, xlsxFilePath);
};

const processData = () => {
  processProfit();
  processPopulations();
};

const createCSV_XLSX = () => {
  const profit = extractJson("./db/profit.json");
  const populations = extractJson("./db/populations.json");
  const fieldNames = extractJson("./db/fieldNames.json");

  const profitData = profit.map((e, index) => ({
    category: profit[index].type, // Add label to each row
    ...e.data,
  }));

  const populationsData = populations.map((e, index) => ({
    category: populations[index].type, // Add label to each row
    ...e.data,
  }));

  // Add "Category" to field names
  const labeledFieldNames = ["category", ...fieldNames];

  // JSON to CSV via fieldNames and data
  const profitCsvPath = "./db/profit.csv";
  const populationsCsvPath = "./db/populations.csv";

  jsonToCsv(labeledFieldNames, profitData, profitCsvPath);
  jsonToCsv(labeledFieldNames, populationsData, populationsCsvPath);

  // Convert CSV files to XLSX
  csvToXlsx(profitCsvPath, "./db/profit.xlsx");
  csvToXlsx(populationsCsvPath, "./db/populations.xlsx");
};

processData();
createCSV_XLSX();
