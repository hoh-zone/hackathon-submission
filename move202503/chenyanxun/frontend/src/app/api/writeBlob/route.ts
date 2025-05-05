import { statusCode } from "@/constant/response";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({
      message: "file is required",
      status: statusCode.BAD_REQUEST,
    });
  }

  try {
    const encryptedData = await file
      .arrayBuffer()
      .then((buffer: ArrayBuffer) => new Uint8Array(buffer));
    const result = await fetch(
      "https://publisher.testnet.walrus.atalma.io/v1/blobs?epochs=5",
      {
        method: "PUT",
        body: encryptedData,
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
