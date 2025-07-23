cat > entrypoint.sh <<'EOF'
#!/bin/sh
# apply migrations
python src/manage.py migrate --noinput

# then hand off to whatever CMD was given
exec "$@"
EOF
