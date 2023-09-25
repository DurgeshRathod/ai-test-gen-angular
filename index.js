const fs = require("fs");
const OpenAI = require("openai");
let currPath = process.argv[1];
currPath = currPath.split("/");
let projectAbosultePath = currPath.slice(0, currPath.length - 3).join("/");

if (!process.env.OPENAI_API_KEY) {
  throw Error("Environment variable OPENAI_API_KEY is missing");
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
concatenatedData = readFilesRecursivelyForModels(
  targetFilePath,
  "Generate Unit test for Below code : ",
  []
);

function countOccurrences(str, substr) {
  let count = 0;
  let position = str.indexOf(substr);

  while (position !== -1) {
    count++;
    position = str.indexOf(substr, position + 1);
  }

  return count;
}

function readFilesRecursivelyForModels(currFilePath, prefixedString, alreadyReadFiles) {
  const currFilePathElements = currFilePath.split("/");
  const pattern = /from ['"]([^'"]+)['"]/g;
  try {
    if (alreadyReadFiles.includes(currFilePath)) {
      return "";
    }
    console.log("\nReading  ", currFilePath);
    alreadyReadFiles.push(currFilePath);
    let data = fs.readFileSync(currFilePath, "utf8");

    let match;
    childData = "";
    while ((match = pattern.exec(data)) !== null) {
      let path = match[1];
      if (path.includes(".model") || path.includes(".enum") || path.includes(".interface")) {
        Object.keys(pathMap).forEach((key) => {
          path = path.replace(key, pathMap[key]);
        });
        let doubleDotCount = countOccurrences(path, "../");
        let singleDotCount = countOccurrences(path, "./");
        if (doubleDotCount > 0) {
          let tillIdx = currFilePathElements.length - 1 - doubleDotCount;
          let newpath = currFilePathElements.slice(0, tillIdx);
          newpath.push(...path.split("/").filter((f) => f !== ".."));
          path = newpath.join("/");
        } else if (singleDotCount > 0) {
          let tillIdx = currFilePathElements.length - 1;
          let newpath = currFilePathElements.slice(0, tillIdx);
          newpath.push(...path.split("/").filter((f) => f !== "."));
          path = newpath.join("/");
        } else {
          path = `${projectAbosultePath}/${path}`;
        }
        path = path + ".ts";
        childData = childData + " " + readFilesRecursivelyForModels(path, "", alreadyReadFiles);
      }
    }

    return childData + prefixedString + data;
  } catch (error) {
    console.log(error);
  }
}

async function main() {
  let system_prompt =
    "You are a angular unit test generator tool which will output only the generated unit test file which uses jasmine framework, Follow the instructions word by word. Instructions: Ensure that the tests have maximum coverage for both statements and branches. Additionally, make sure to test edge cases and handle potential error scenarios. Ensure that all opening brackets are properly closed.";
  let prompt_text = "";
  prompt_text += concatenatedData;
  prompt_text = prompt_text + " output: ";
  const ASSISTANT = { role: "system", content: system_prompt };
  console.log("\nCreating unit tests ⏳⏳");
  const response = await openai.chat.completions.create({
    temperature: 0,
    model: "gpt-3.5-turbo-16k",
    messages: [ASSISTANT, { role: "user", content: prompt_text }],
  });

  outputText = response.choices[0].message.content;

  if (outputText.endsWith("```")) {
    outputText = outputText.slice(0, outputText.length - 3);
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
  console.log("\n\nCreated !!! ✅✅ \nFile written to the path 👉 : 🔗 ", outputFile, "\n");
}
main();
