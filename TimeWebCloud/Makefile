# Деплой на Timeweb Cloud: ssh root@хост. Пароль из TimeWebCloud/.env (PASSWORD=…) — через ssh-wrap.sh + sshpass.
# Без PASSWORD в .env — обычный ssh (ключ или ручной ввод). IPv6: make SSH_OPTS=-6 SSH_HOST='$(IPv6)' bootstrap-site
# Переменные из TimeWebCloud/.env подключаются как в Makefile (KEY=value, без пробелов вокруг =). Переопределяют значения по умолчанию ниже.
.PHONY: help connect bootstrap-site update-ui update-ui-upload clean start stop nginx-proxy https diagnose reset-nginx-ssl upload-speakers

TIMEWEB_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
-include $(TIMEWEB_DIR).env
export

SSH_WRAP := $(TIMEWEB_DIR)ssh-wrap.sh
LOCAL_DIR := $(TIMEWEB_DIR)local
LOCAL_SPEAKERS_DIR := $(LOCAL_DIR)/speakers
SCP_WRAP := $(LOCAL_DIR)/scp-wrap.sh
BOOTSTRAP_SH := $(TIMEWEB_DIR)bootstrap-site.sh
UPDATE_UI_SH := $(TIMEWEB_DIR)update-ui.sh
UPDATE_UI_FROM_ZIP_SH := $(LOCAL_DIR)/update-ui-from-zip.sh
NGINX_PROXY_SH := $(TIMEWEB_DIR)nginx-proxy.sh
DIAGNOSE_SH := $(TIMEWEB_DIR)diagnose.sh
CERTBOT_SH := $(TIMEWEB_DIR)certbot-nginx.sh

IPv4 ?= 72.56.9.194
IPv6 ?= 2a03:6f00:a::1:b73f
SSH_USER  ?= root
SSH_HOST  ?= $(IPv4)
SSH_OPTS  ?=
REMOTE_DIR ?= /opt/internetaddicts
REMOTE_AUDIO_DIR ?= /var/www/audio/speakers
# = чтобы подхватывать REMOTE_DIR с командной строки
SITE_ROOT = $(REMOTE_DIR)/current
# Распакованный dist из CI: server/entry.mjs + client/ (Astro static + @astrojs/node, SSR где prerender=false)

# GitHub Release v1.0.1 (Node standalone) → astro-dist-v1.0.1.zip. SHA от файла на Releases, не от Artifacts в Actions.
RELEASE_TAG  ?= v1.2.2
RELEASE_ZIP  := astro-dist-$(RELEASE_TAG).zip
DOWNLOAD_URL := https://github.com/Pavel-second-account/internetaddicts/releases/download/$(RELEASE_TAG)/$(RELEASE_ZIP)
# package.json (и lock при наличии) внутри astro-dist-*.zip — отдельных ассетов на релизе нет
LOCAL_ZIP := $(LOCAL_DIR)/$(RELEASE_ZIP)
REMOTE_ZIP := /tmp/$(RELEASE_ZIP)

# Оставьте пустым, чтобы не проверять: make EXPECTED_SHA256=
EXPECTED_SHA256 ?=


PM2_APP_NAME ?= internetaddicts-site
SERVE_PORT   ?= 4321

# Домен для server_name в nginx (стейдж: make DOMAIN=internetaddicts-dev2.ru nginx-proxy)
DOMAIN ?= internetaddicts.ru
# Гибрид (apex на VPS, сайт на www у Timeweb): make nginx-proxy REDIRECT_TO=https://www.internetaddicts.ru
REDIRECT_TO ?=
# make https: email для ACME (можно задать в .env: CERTBOT_EMAIL=…)
CERTBOT_EMAIL ?=
CERTBOT_SECONDARY ?= www.$(DOMAIN)
# 1 — тестовый ACME (staging), без лимитов продакшена
CERTBOT_STAGING ?=

SSH := $(SSH_WRAP) $(strip $(SSH_OPTS)) $(SSH_USER)@$(SSH_HOST)

help:
	@echo "connect — ssh root@… (если в .env есть PASSWORD — без запроса, нужен sshpass)"
	@echo "bootstrap-site — один zip с релиза (dist + package.json) → $(SITE_ROOT), npm install на VPS"
	@echo "update-ui      — деплой UI: VPS качает zip с GitHub Releases (медленно)"
	@echo "update-ui-upload — скачать в local/ → scp на VPS → распаковка"
	@echo "clean          — на VPS: остановить $(PM2_APP_NAME), удалить $(SITE_ROOT), пустой каталог для следующего деплоя"
	@echo "start          — pm2 + node $(SITE_ROOT)/server/entry.mjs (порт $(SERVE_PORT), Astro + Node)"
	@echo "stop           — остановить процесс $(PM2_APP_NAME)"
	@echo "nginx-proxy    — nginx :80 → Node или 301 (DOMAIN=$(DOMAIN), REDIRECT_TO=$(REDIRECT_TO) пусто = прокси)"
	@echo "https          — certbot certonly --webroot (по умолчанию DOMAIN+www; DNS должен указывать на VPS)"
	@echo "diagnose       — проверки nginx/pm2/портов на VPS"
	@echo "reset-nginx-ssl— удалить vhost $(DOMAIN) и LE-серт (certbot), затем reload nginx"
	@echo "upload-speakers — загрузить аудио из local/speakers/ → $(REMOTE_AUDIO_DIR) на VPS (один раз, вне деплой-цикла)"
	@echo "Пример IPv6:   make SSH_OPTS=-6 SSH_HOST='$(IPv6)' bootstrap-site"
	@echo ""
	@echo "Домен указывает на этот IP — дальше: nginx/Caddy на :80/:443, HTTPS (см. Изначальное исследование.md)"

# Интерактивное подключение (без удалённой команды)
connect:
	$(SSH)

#1) Первичная настройка сервера + выкладка артефакта (скрипт выполняется на VPS)
bootstrap-site:
	$(SSH) env REMOTE_DIR='$(REMOTE_DIR)' DOWNLOAD_URL='$(DOWNLOAD_URL)' EXPECTED_SHA256='$(EXPECTED_SHA256)' bash -s < $(BOOTSTRAP_SH)

# Быстрый деплой UI/контента: только server+client + pm2 restart; если package.json в релизе изменился — остановка с подсказкой на bootstrap-site.
update-ui:
	$(SSH) env REMOTE_DIR='$(REMOTE_DIR)' DOWNLOAD_URL='$(DOWNLOAD_URL)' EXPECTED_SHA256='$(EXPECTED_SHA256)' PM2_APP_NAME='$(PM2_APP_NAME)' SERVE_PORT='$(SERVE_PORT)' bash -s < $(UPDATE_UI_SH)

# TimeWebCloud/local/astro-dist-<tag>.zip — всегда качается сюда, затем scp на VPS
update-ui-upload:
	mkdir -p '$(LOCAL_DIR)'
	curl -fSL -o '$(LOCAL_ZIP)' '$(DOWNLOAD_URL)'
	$(SCP_WRAP) $(strip $(SSH_OPTS)) '$(LOCAL_ZIP)' '$(SSH_USER)@$(SSH_HOST):$(REMOTE_ZIP)'
	$(SSH) env REMOTE_DIR='$(REMOTE_DIR)' ZIP_PATH='$(REMOTE_ZIP)' EXPECTED_SHA256='$(EXPECTED_SHA256)' PM2_APP_NAME='$(PM2_APP_NAME)' SERVE_PORT='$(SERVE_PORT)' bash -s < $(UPDATE_UI_FROM_ZIP_SH)

# Убрать выкладку на сервере; дальше: make bootstrap-site && make start && make nginx-proxy
clean:
	$(SSH) sh -c "set -e; pm2 delete $(PM2_APP_NAME) 2>/dev/null || true; rm -rf '$(SITE_ROOT)'; mkdir -p '$(SITE_ROOT)'"

# 2) Astro Node standalone (после bootstrap-site; nginx проксирует сюда)
start:
	$(SSH) sh -c "set -e; command -v pm2 >/dev/null || npm install -g pm2; pm2 delete $(PM2_APP_NAME) 2>/dev/null || true; cd '$(SITE_ROOT)' && NODE_ENV=production HOST=127.0.0.1 PORT=$(SERVE_PORT) pm2 start server/entry.mjs --name $(PM2_APP_NAME) --interpreter node; pm2 save"

# 3) Остановка
stop:
	$(SSH) sh -c "pm2 delete $(PM2_APP_NAME) 2>/dev/null || true"

#4) Nginx → Node (сначала make start)
nginx-proxy:
	$(SSH) env DOMAIN='$(DOMAIN)' BACKEND_PORT='$(SERVE_PORT)' REDIRECT_TO='$(REDIRECT_TO)' bash -s < $(NGINX_PROXY_SH)

# Lets Encrypt (порт 80 должен отдавать этот nginx; после выдачи серта перегенерируем nginx-конфиг с :443)
https:
	@test -n "$(CERTBOT_EMAIL)" || (echo >&2 "Задайте CERTBOT_EMAIL в .env или: make https CERTBOT_EMAIL=you@example.com"; exit 1)
	$(SSH) env DOMAIN='$(DOMAIN)' CERTBOT_EMAIL='$(CERTBOT_EMAIL)' CERTBOT_SECONDARY='$(CERTBOT_SECONDARY)' CERTBOT_STAGING='$(CERTBOT_STAGING)' bash -s < $(CERTBOT_SH)
	$(MAKE) nginx-proxy

# Почему не открывается сайт: смотреть вывод на VPS
diagnose:
	$(SSH) bash -s $(DOMAIN) $(SERVE_PORT) < $(DIAGNOSE_SH)


# Загрузка аудио-файлов спикерских на VPS (один раз; не входит в деплой-цикл)
upload-speakers:
	$(SSH) mkdir -p '$(REMOTE_AUDIO_DIR)'
	$(SCP_WRAP) $(strip $(SSH_OPTS)) -r '$(LOCAL_SPEAKERS_DIR)/.' '$(SSH_USER)@$(SSH_HOST):$(REMOTE_AUDIO_DIR)/'

reset-nginx-ssl:
	$(SSH) sh -c "set -e; rm -f /etc/nginx/sites-enabled/$(DOMAIN).conf /etc/nginx/sites-available/$(DOMAIN).conf; if command -v certbot >/dev/null 2>&1; then certbot delete --cert-name $(DOMAIN) --non-interactive 2>/dev/null || true; fi; nginx -t; systemctl reload nginx || systemctl restart nginx"


rebuild:
	make clean
	make bootstrap-site 
	make start
	make https
	make nginx-proxy