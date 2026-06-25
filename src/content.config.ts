import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/md/` directory.
	loader: glob({ base: './src/content/blog/md', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			// 旧博客导出使用 crtime/uptime,这里映射为 pubDate/updatedDate
			crtime: z.coerce.date(),
			uptime: z.coerce.date().optional(),
			// 旧导出的 tags 是逗号分隔字符串(如 "React,React Router,前端"),转为数组
			tags: z
				.string()
				.optional()
				.transform((v) =>
					v ? v.split(',').map((t) => t.trim()).filter(Boolean) : [],
				),
			heroImage: z.optional(image()),
		}).transform(({ crtime, uptime, ...rest }) => ({
			...rest,
			pubDate: crtime,
			updatedDate: uptime,
		})),
});

export const collections = { blog };
