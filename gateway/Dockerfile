FROM nginx:1.27-alpine

# Install healthcheck tools
RUN apk add --no-cache curl

COPY gateway/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck to verify nginx is running
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/auth/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
