# Prints UAE — metal posters & prints (Astro)

Статический сайт-магазин металлических постеров и услуг печати на металле
(фотопечать, вывески, награды) с прицелом на SEO. Собран на **Astro** —
на выходе чистый статический HTML, идеально ложится на Vercel.

## Требования

- **Node.js ≥ 22.12** (Astro 7 не работает на Node 18). Версия зафиксирована в `.nvmrc` и `package.json → engines`.

## Локальная разработка

```powershell
cd C:\Users\Asa\PycharmProjects\Rasul\subl_pechat_web
npm install
npm run dev      # http://localhost:4321
```

Сборка и предпросмотр продакшн-версии:

```powershell
npm run build    # генерирует папку dist/
npm run preview  # локальный предпросмотр dist/
```

## Как менять контент

- **Товары, размеры, цены, категории** — `src/data/posters.json`
- **Бизнес-данные, услуги, тексты категорий, FAQ** — `src/data/site.json`
  (телефон, WhatsApp, адрес, геокоординаты — всё здесь, в одном месте)
- **Домен** — `astro.config.mjs` (`site: "..."`) и `public/robots.txt`

Новые страницы (категории `/space-metal-posters/`, услуги `/metal-signage/`),
sitemap, хлебные крошки и schema.org генерируются автоматически из этих данных.

> ⚠️ Перед запуском замените заглушки: `whatsapp`, `phoneDisplay`, `email`,
> `address` в `site.json` и домен в `astro.config.mjs`.

## Деплой на Vercel

### Вариант A — через веб-интерфейс (проще)

1. Залейте проект в репозиторий GitHub/GitLab (см. ниже про git).
2. На [vercel.com](https://vercel.com) → **Add New → Project** → импортируйте репозиторий.
3. Vercel сам определит Astro. Настройки по умолчанию верные:
   - Framework Preset: **Astro**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Node version:** в Project → Settings → General убедитесь, что стоит **22.x**
   (Vercel читает `engines.node` из `package.json`, обычно подхватывает сам).
5. **Deploy.** Через ~1 мин получите превью-URL.
6. Домен: Project → Settings → **Domains** → добавьте `printsuae.com`,
   пропишите DNS-записи, которые покажет Vercel.

### Вариант B — через CLI (без git)

```powershell
cd C:\Users\Asa\PycharmProjects\Rasul\subl_pechat_web
npm i -g vercel
vercel            # первый раз — логин + вопросы, отвечайте Enter/Yes
vercel --prod     # продакшн-деплой
```

### Инициализация git (для Варианта A)

```powershell
cd C:\Users\Asa\PycharmProjects\Rasul\subl_pechat_web
git init
git add .
git commit -m "Prints UAE — metal posters site"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

`.gitignore` уже исключает `node_modules/`, `dist/`, `.astro/`.

## Что сделано для SEO

- Полные `<title>`/`description`, canonical, Open Graph и Twitter-карточки на каждой странице.
- Разметка schema.org: `LocalBusiness` (единый `@id`), `WebSite`, `Service`,
  `Product` + `Offer`, `BreadcrumbList`, `FAQPage`, `ItemList`.
- Автогенерируемые `sitemap-index.xml` + `robots.txt`.
- SEO-slug'и: `/space-metal-posters/`, `/dubai-marina-night-metal-poster/` и т.п.
- Отдельные лендинги под категории и услуги (страницы под коммерческие запросы).
- Внутренняя перелинковка (навигация, футер, кросс-ссылки, похожие товары).
- Семантический HTML, alt у изображений, hreflang `en-AE`, `theme-color`.
- Производительность: `preconnect`, `loading="lazy"`, `width/height` (защита от CLS),
  long-cache для `/_astro/*`.

## Дальнейшие шаги (рекомендации)

- Заменить хотлинки на Wikimedia собственными изображениями товаров (лучше для скорости и уникальности).
- Добавить реальный OG-баннер `public/og-cover.jpg` (1200×630).
- Завести Google Business Profile и Search Console, подать sitemap.
- Добавить блог/гайды под информационные запросы («how to hang metal prints» и т.п.).
- Настроить аналитику (Vercel Analytics / Plausible).
