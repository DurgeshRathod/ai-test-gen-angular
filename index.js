const fs = require("fs");
const OpenAI = require("openai");
let currPath = process.argv[1];
currPath = currPath.split("/");
let projectAbosultePath = currPath.slice(0, currPath.length - 3).join("/");

if (!process.env.OPEN_API_KEY) {
  throw Error("Environment variable OPEN_API_KEY is missing");
}
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
});
let prompt_text = "";
let targetFilePath = process.argv[2];
targetFilePath = targetFilePath
  .split("/")
  .filter((f) => f !== "." || f !== "..")
  .join("/");
targetFilePath = `${projectAbosultePath}/${targetFilePath}`;
if (process.argv.length !== 4) {
  console.log(
    "\nERROR: Incorrect command. \n\nUSAGE : node ./node_modules/ai-test-gen-angular/index.js <src/path/to/component/or/service/ts-file> <src/path/to/ts-config-file>\n"
  );
  return;
}
let tsconfigPath = `${projectAbosultePath}/tsconfig.json`;
if (process.argv[3]) {
  tsconfigPath = `${projectAbosultePath}/${process.argv[3]}`;
} else {
  throw Error(
    "Incorrect command. Usage : node ./node_modules/ai-test-gen-angular/index.js <src/path/to/component/or/service/ts-file> <src/path/to/ts-config-file>"
  );
}
let tsconfig = { compilerOptions: { path: {} } };
try {
  console.log("\nReading ", tsconfigPath);
  tsconfig = require(tsconfigPath);
} catch (error) {
  console.error("ERROR: tsconfig not present at root folder\n", error);
  return;
}

let pathMap = {};
if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  let pathObj = tsconfig.compilerOptions.paths;
  for (let key in pathObj) {
    if (Object.hasOwnProperty.call(pathObj, key)) {
      let value = pathObj[key];
      let key1 = key.replace(/\*/g, "");
      value = value[0].replace(/\*/g, "");
      pathMap[key1] = value;
    }
  }
}

let outputFile = targetFilePath.replace(".ts", ".ai-test-gen.spec.ts");
let concatenatedData = "";
let paths = [];
let targetFilePathElements = targetFilePath.split("/");
fs.readFile(targetFilePath, "utf8", async (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const pattern = /from ['"]([^'"]+)['"]/g;

  let match;
  while ((match = pattern.exec(data)) !== null) {
    paths.push(match[1]);
  }

  Object.keys(pathMap).forEach((key) => {
    paths.forEach((path, i) => {
      if (path.includes(key)) {
        paths[i] = path.replace(key, pathMap[key]);
      }
    });
  });
  paths = paths.filter(
    (p) => p.includes(".model") || p.includes(".enum") || p.includes(".interface")
  );
  paths.forEach((path, i) => {
    let count = countOccurrences(path, "..");
    if (count > 0) {
      let tillIdx = targetFilePathElements.length - 1 - count;
      let newpath = targetFilePathElements.slice(0, tillIdx);
      path = path.split("/").filter((f) => f !== "..");
      newpath.push(...path);
      paths[i] = newpath.join("/");
    } else {
      paths[i] = `${projectAbosultePath}/${path}`;
    }
  });
  paths = paths.map((p) => p + ".ts");
  paths.push(targetFilePath);

  for (const filePath of paths) {
    try {
      console.log("Reading ", filePath);
      concatenatedData += " " + fs.readFileSync(filePath, "utf8");
    } catch (error) {
      // Handle error
    }
  }
  main();
});

function countOccurrences(str, substr) {
  let count = 0;
  let position = str.indexOf(substr);

  while (position !== -1) {
    count++;
    position = str.indexOf(substr, position + 1);
  }

  return count;
}

async function main() {
  system_prompt =
    "Act as a angular developer use jasmine to write a unit test file for below code with maximum coverage for statements and branches. Prepare mock data by yourself based on the model/interface/class. Write only the unit test code as string output in the output and nothing else. And very important don't add any single line comments and make sure all the opening brackets are closed properly ";
  prompt_text = "Code: ```import{";
  prompt_text += concatenatedData;
  const ASSISTANT = { role: "system", content: system_prompt };
  console.log("\nCreating unit tests ⏳⏳");
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-16k",
    messages: [ASSISTANT, { role: "user", content: prompt_text }],
  });

  outputText = response.choices[0].message.content;

  if (outputText.endsWith("```")) {
    outputText = outputText.slice(0, outputText.length - 3);
  }
  if (!outputText.startsWith("{") && !outputText.startsWith("import")) {
    let idx = outputText.indexOf("import");
    if (idx >= 0) {
      outputText = outputText.slice(idx);
    }
  }
  outputText = outputText.startsWith("{") ? `import ${outputText}` : outputText;
  fs.writeFileSync(outputFile, outputText);
  outputFile = outputFile
    .split("/")
    .filter((f) => f !== "." || f !== "..")
    .join("/");

  console.log(
    "\n \n------------------------------------------------------\nFor better result you can store your class models, types, enum, interface in files with extension \n1) .model.ts \n2) .enum.ts \n3) .interface.ts\n4) reading for files which are exported from a index.ts is currently not supported \n\n NOTE: the generated file may have some extra or missing characters at the start or end of the file which may need to be removed or added manually."
  );
  console.log("\n\nCreated !!! ✅✅ \nFile written to the path : 🔗 ", outputFile, "\n");
}
