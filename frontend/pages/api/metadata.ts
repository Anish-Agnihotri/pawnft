import Redis from "ioredis"; // Redis

/**
 * Temporary work-around for not having an OpenSea API key
 * Literally, store metadata in Redis on creation :(
 */
const metadata = async (req, res) => {
  // Collect required parameters
  const { name, description, imageURL, tokenAddress, tokenId } = req.body;

  // Enforce required parameters
  if (!name || !description || !imageURL || !tokenAddress || !tokenId) {
    res.status(502).send({ error: "Missing parameters" });
  }

  // Setup redis and data structure
  const client = new Redis(process.env.REDIS_URL);
  let existingData = await client.get("metadata");
  let newData: Record<string, Record<string, string>> = {};

  // If data exists
  if (existingData) {
    // Parse and replace structure
    newData = JSON.parse(existingData);
  }

  // Update structure with new metadata
  newData[`${tokenAddress.toLowerCase()}-${tokenId.toString()}`] = {
    name,
    description,
    imageURL,
  };

  // Save metadata and return
  await client.set("metadata", JSON.stringify(newData));
  res.status(200).send();
};

export default metadata;
