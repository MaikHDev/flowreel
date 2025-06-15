import path from "path";
import { z } from "zod";
import fs from "node:fs";
import formidable from "formidable";


import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";


export const config = {
  api: {
    bodyParser: false, // Disable body parsing for FormData
  },
};
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir); // Ensure the uploads directory exists
}
export const mediaRouter = createTRPCRouter({
  // create: protectedProcedure
  //   .input(z.object({ name: z.string().min(1) }))
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db.insert(posts).values({
  //       name: input.name,
  //       createdById: ctx.session.user.id,
  //     });
  //   }),

  postNewFile: protectedProcedure
    .input(z.unknown())
    .mutation(async ({ctx, input}) => {
      return new Promise((resolve, reject) => {
        // if(input !== typeof File){
        //   reject(new Error("Not a file!"))
        // }
        const form = new formidable.IncomingForm();
        form. = uploadsDir;
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }

          console.log("Uploaded files:", files);
          resolve({
            message: "File uploaded successfully",
            files,
          });
        });
      })

    })
});
