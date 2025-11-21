import fs from "node:fs/promises";

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    let messages = [];

    // Example of process.argv:
    // [ '/usr/local/bin/node', '/app/src/app.js', 'Bob' ]
    const args = process.argv.slice(2);
    console.log(`Received ${args.length} args`);
    messages.push(args.join(" "));

    const { IEXEC_APP_DEVELOPER_SECRET } = process.env;
    if (IEXEC_APP_DEVELOPER_SECRET) {
      const redactedAppSecret = IEXEC_APP_DEVELOPER_SECRET.replace(/./g, "*");
      console.log(`Got an app secret (${redactedAppSecret})!`);
    } else {
      console.log(`App secret is not set`);
    }

    // Write result to IEXEC_OUT
    const resultText = `Hello, ${messages.join(" ") || "World"}!`;
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, resultText);

    // Build the "computed.json" object
    computedJsonObj = {
      "deterministic-output-path": `${IEXEC_OUT}/result.txt`,
    };
  } catch (e) {
    // Handle errors
    console.log(e);

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      "deterministic-output-path": IEXEC_OUT,
      "error-message": "Oops something went wrong",
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

main();
