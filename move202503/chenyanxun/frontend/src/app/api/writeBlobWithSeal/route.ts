import { statusCode } from "@/constant/response";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base64Data = searchParams.get("data") as string;
  const buffer = Buffer.from(base64Data, 'base64');
  const uint8Array = new Uint8Array(buffer);

  try {
    const result = await fetch(
      "https://publisher.testnet.walrus.atalma.io/v1/blobs?epochs=5",
      {
        method: "PUT",
        body: uint8Array,
      }
    );
    const data = await result.json();
    if (!data) {
      return NextResponse.json({
        message: "user not found",
        status: statusCode.NOTFOUND,
      });
    }

    return NextResponse.json({
      data: data,
      message: "success",
      status: statusCode.SUCCESS,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      message: "Internal Server Error",
      status: statusCode.INTERNT_ERROR,
    });
  }
}
