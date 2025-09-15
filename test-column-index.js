#!/usr/bin/env node
/**
 * Test column index calculations for Google Sheets
 * Validates that our column index math is correct
 */

// Helper to convert column letter to index
function columnToIndex(column) {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1; // Convert to 0-based
}

// Helper to calculate index when fetching a range starting from a column
function getIndexInRange(startColumn, targetColumn) {
  const startIndex = columnToIndex(startColumn);
  const targetIndex = columnToIndex(targetColumn);
  return targetIndex - startIndex;
}

console.log('Column Index Calculations for Google Sheets\n');
console.log('===========================================\n');

// Test basic column conversions
console.log('Column Letter to Index (0-based):');
console.log('  A  =', columnToIndex('A'), '(expected: 0)');
console.log('  B  =', columnToIndex('B'), '(expected: 1)');
console.log('  Z  =', columnToIndex('Z'), '(expected: 25)');
console.log('  AA =', columnToIndex('AA'), '(expected: 26)');
console.log('  AB =', columnToIndex('AB'), '(expected: 27)');
console.log('  AC =', columnToIndex('AC'), '(expected: 28)');
console.log('  AD =', columnToIndex('AD'), '(expected: 29)');
console.log();

// Test our specific use case: fetching B:AD
console.log('When fetching range B:AD:');
console.log('  Column B  (JID)           = index', getIndexInRange('B', 'B'), '(row[0])');
console.log('  Column AA (Album Name)    = index', getIndexInRange('B', 'AA'), '(row[25])');
console.log('  Column AB (Album Link)    = index', getIndexInRange('B', 'AB'), '(row[26])');
console.log('  Column AC (Folder Name)   = index', getIndexInRange('B', 'AC'), '(row[27])');
console.log('  Column AD (Folder Link)   = index', getIndexInRange('B', 'AD'), '(row[28])');
console.log();

// Test the old incorrect assumption
console.log('Previous INCORRECT indices (when fetching B:AC):');
console.log('  Was using row[1] for JID - WRONG! (would be column C)');
console.log('  Was using row[25] for album - Correct by chance');
console.log('  Was using row[27] for folder - Correct by chance');
console.log();

console.log('✅ FIXED: Now using row[0] for JID when fetching B:AD');
console.log('✅ This allows rows to be reordered without breaking lookup');