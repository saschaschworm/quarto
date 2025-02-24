import { CreateVotingSchema, UpdateVotingSchema } from "@quarto-voting/schemas";
import { type NextRequest as Request } from "next/server";
import { ZodError } from "zod";

import { create, get, update } from "@/services/voting";

export const GET = async (request: Request, props: { params: Promise<{ channel: string }> }): Promise<Response> => {
  // Parse the channel from the request parameters and return the voting based on the channel with a 200 status code.
  const { channel } = await props.params;
  const voting = await get(channel);
  return Response.json(voting, { status: 200 });
};

export const POST = async (request: Request, props: { params: Promise<{ channel: string }> }): Promise<Response> => {
  try {
    // Parse the channel from the request parameters and the payload from the request body. Then, create a new voting
    // based on the channel and the payload and return it with a 201 status code. If the payload is invalid, return a
    // 400 status code with the error details.
    const { channel } = await props.params;
    const payload = CreateVotingSchema.parse(await request.json());
    const voting = await create(channel, payload);
    return Response.json(voting, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      // If the error is a validation error, return a JSON response with the error details and a 400 status code.
      // eslint-disable-next-line prettier/prettier
      return Response.json(error.flatten((issue) => ({ code: issue.code, message: issue.message })), { status: 400 });
    } else if (error instanceof SyntaxError) {
      // If the error is indicative of invalid JSON, return a JSON response with an error message and a 400 status code.
      return Response.json({ error: "invalid json" }, { status: 400 });
    } else throw error;
  }
};

export const PATCH = async (request: Request, props: { params: Promise<{ channel: string }> }): Promise<Response> => {
  try {
    // Parse the channel from the request parameters and the payload from the request body. Then, update the voting
    // based on the channel and the payload and return it with a 200 status code. If the payload is invalid, return a
    // 400 status code with the error details.
    const { channel } = await props.params;
    const payload = UpdateVotingSchema.parse(await request.json());
    const voting = await update(channel, payload);
    return Response.json(voting, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      // If the error is a validation error, return a JSON response with the error details and a 400 status code.
      // eslint-disable-next-line prettier/prettier
      return Response.json(error.flatten((issue) => ({ code: issue.code, message: issue.message })), { status: 400 });
    } else if (error instanceof SyntaxError) {
      // If the error is indicative of invalid JSON, return a JSON response with an error message and a 400 status code.
      return Response.json({ error: "invalid json" }, { status: 400 });
    } else throw error;
  }
};

export const OPTIONS = async (): Promise<Response> => {
  // Return a response with a 204 status code to indicate that the request was successful.
  return new Response(null, { status: 204 });
};
