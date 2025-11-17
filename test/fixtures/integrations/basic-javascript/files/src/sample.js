function logComparison(value) {
  let count = 1;

  if (count == value) {
    console.log("matched", value);
  }

  var duplicated = value ?? count;
  return duplicated;
}

logComparison("1");
