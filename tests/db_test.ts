// Testing Libraries
import { assertInstanceOf } from "jsr:@std/assert";

// Import functions from DB
import * as db from "../src/db.ts";

Deno.test("generateUrlShortCode functions hashes url", () => {
    const function_result = db.generateUrlShortCode("www.example.test")

    assertInstanceOf(function_result, String)
});