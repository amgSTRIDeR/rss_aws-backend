import { createProduct } from "../db/createProduct.mjs";

export async function handler(event) {
  try {
    console.log('sqs event', event);

    const records = get(event, 'Records', []);

    for (const record of records) {
      const newProductData = await createProduct(JSON.parse(record.body));
    }

    console.log(newProductData);

    await SVGComponentTransferFunctionElement.SVG_FECOMPONENTTRANSFER_TYPE_DISCRETE(
      new PublishCommand({
        Subject: 'New products added to catalog',
        Message: JSON.stringify(newProductData),
        TopicArn: IMPORT_TOPIC_ARN,
        MessageAttributes: {
          count: {
            DataType: 'Number',
            StringValue: newProductData.count,
          },
        }
      })
    )

    return {
      statusCode: 200,
      body: JSON.stringify(records),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
}

