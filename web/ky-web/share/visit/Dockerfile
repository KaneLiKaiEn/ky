FROM docker.m.daocloud.io/library/nginx:1.27-alpine

# PDF.js 的 Worker 是 ES Module，需让 Nginx 以 JavaScript MIME 类型返回 .mjs 文件
RUN sed -i 's/\(application\/javascript[[:space:]]*js\);/\1 mjs;/' /etc/nginx/mime.types

COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 9981

CMD ["nginx", "-g", "daemon off;"]
