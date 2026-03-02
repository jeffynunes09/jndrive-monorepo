# MoveGo — Design System Reference

> Referência visual para importação no Figma ou uso com plugins como `html.to.design` / `Anima`.

---

## 🎨 Paleta de Cores (Tokens)

| Token | HSL | Uso |
|---|---|---|
| `--background` | `hsl(226 44% 9%)` | Fundo principal de todas as telas |
| `--foreground` | `hsl(210 40% 96%)` | Texto principal (branco suave) |
| `--primary` | `hsl(180 75% 52%)` | Teal — CTA, ativo, destaque |
| `--primary-foreground` | `hsl(226 44% 9%)` | Texto sobre botões teal |
| `--muted` | `hsl(226 35% 16%)` | Fundo de elementos secundários |
| `--muted-foreground` | `hsl(210 20% 55%)` | Texto secundário / placeholder |
| `--card` | `hsl(226 40% 13%)` | Fundo de cards internos |
| `--border` | `hsl(226 35% 20%)` | Bordas e divisores |
| `--navy-input` | `hsl(226 36% 20%)` | Fundo de inputs e ícones de ação |
| Gradiente principal | `linear-gradient(135deg, hsl(180 75% 45%), hsl(195 80% 52%))` | Cards de destaque, botão CTA, FAB |
| Gradiente de fundo | `linear-gradient(180deg, hsl(226 44% 9%), hsl(226 44% 7%))` | Background da Splash |

---

## 🔤 Tipografia

| Elemento | Fonte | Peso | Tamanho | Classe Tailwind |
|---|---|---|---|---|
| App Name | Space Grotesk | 700 | 24px | `text-2xl font-bold` |
| Título de seção | Space Grotesk | 700 | 14px | `text-sm font-bold` |
| Label de seção | Space Grotesk | 600 | 10px | `text-[10px] font-semibold` |
| Texto de corpo | Space Grotesk | 400 | 9px | `text-[9px]` |
| Valor monetário grande | Space Grotesk | 700 | 20px | `text-xl font-bold` |
| Valor monetário médio | Space Grotesk | 700 | 18px | `text-lg font-bold` |
| Stat value | Space Grotesk | 700 | 12px | `text-xs font-bold text-primary` |
| Placeholder / hint | Inter | 400 | 9-10px | `text-xs text-muted-foreground` |
| Status bar | Inter | 400 | 10px | `text-[10px] text-muted-foreground` |

---

## 📐 Bordas e Raios

| Elemento | Border Radius |
|---|---|
| Frame do telefone | `2.5rem (40px)` |
| Cards principais | `rounded-2xl = 1rem (16px)` |
| Botões e inputs | `rounded-xl = calc(1rem - 2px)` |
| Ícones de ação rápida | `rounded-xl` |
| Avatar / FAB map | `rounded-full` |
| Logo icon | `rounded-2xl` |

---

## 🖼️ Tela 01 — Splash

| Elemento | Propriedade | Valor |
|---|---|---|
| Fundo | `background` | `linear-gradient(180deg, hsl(226 44% 9%), hsl(226 44% 7%))` |
| Logo container | `w h rounded shadow` | `80×80px · rounded-2xl · glow teal 40%` |
| App name | `font color` | `text-2xl font-bold text-foreground` |
| Subtítulo | `font color` | `text-xs text-muted-foreground` |
| Dot ativo | `w h bg` | `w-6 h-1.5 rounded-full bg-primary` |
| Dots inativos | `w h bg` | `w-1.5 h-1.5 rounded-full bg-muted` |
| Status bar | `color` | `text-[10px] text-muted-foreground` |

---

## 🔐 Tela 02 — Login

| Elemento | Propriedade | Valor |
|---|---|---|
| Fundo | `background` | `hsl(226 44% 9%)` |
| Logo | `w h` | `56×56px rounded-xl` |
| Título | `font` | `text-xl font-bold text-foreground` |
| Input e-mail | `bg rounded padding` | `bg: hsl(226 36% 20%) · rounded-xl · px-3 py-2.5` |
| Input senha | `bg rounded padding` | `bg: hsl(226 36% 20%) · rounded-xl · px-3 py-2.5` |
| Placeholder text | `color font` | `text-xs text-muted-foreground` |
| Botão "Entrar" | `w bg rounded color shadow` | `w-full · gradiente teal · rounded-xl · text-primary-foreground · btn-teal-glow` |
| Botão "Entrar" text | `font size` | `text-xs font-semibold` |
| Link "Cadastre-se" | `color font` | `text-primary font-semibold` |

---

## 🏠 Tela 03 — Home

| Elemento | Propriedade | Valor |
|---|---|---|
| Fundo | `background` | `hsl(226 44% 9%)` |
| Header saudação | `font` | `text-[10px] text-muted-foreground` |
| Header nome | `font` | `text-sm font-bold text-foreground` |
| Ícone notificação | `w h bg` | `28×28px · rounded-full · bg: hsl(226 36% 20%)` |
| Card de saldo | `bg rounded padding` | `gradiente teal · rounded-2xl · p-3 · mx-4` |
| Saldo valor | `font color` | `text-lg font-bold text-white` |
| Saldo label | `font color` | `text-[9px] text-white/70` |
| Botão "+" FAB | `w h bg rounded` | `28×28px · rounded-full · bg: hsl(226 44% 9%) · text-primary` |
| Label seção | `font` | `text-[10px] font-semibold` |
| Ícone ação rápida | `w h bg rounded` | `36×36px · rounded-xl · bg: hsl(226 36% 20%) · text-foreground` |
| Label ação rápida | `font color` | `text-[8px] text-muted-foreground` |
| Trip row — origem | `font` | `text-[9px] font-medium` |
| Trip row — destino | `font color` | `text-[9px] text-muted-foreground` |
| Trip row — preço | `font color` | `text-[9px] font-semibold text-primary` |
| Trip row — divisor | `border color` | `border-b: hsl(226 35% 20%)` |

---

## 📊 Tela 04 — Detalhe de Viagem

| Elemento | Propriedade | Valor |
|---|---|---|
| Fundo | `background` | `hsl(226 44% 9%)` |
| Botão voltar | `color font` | `text-primary text-sm` |
| Card resumo | `bg rounded` | `gradiente teal · rounded-2xl · p-3 · mx-4` |
| Valor total | `font color` | `text-xl font-bold text-white` |
| Subtítulo card | `font color` | `text-[8px] text-white/70` |
| Card gráfico | `bg rounded` | `bg: hsl(226 40% 13%) · rounded-2xl · p-3 · mx-4` |
| Barras do gráfico | `bg radius` | `linear-gradient(180deg, hsl(180 75% 52%), hsl(180 75% 52% / 0.3)) · radius: 4px 4px 0 0` |
| Barra ativa | `opacity` | `opacity: 1` |
| Barras inativas | `opacity` | `opacity: 0.5` |
| Labels dias | `font color` | `text-[7px] text-muted-foreground` |
| Dia ativo label | `color font` | `text-[7px] text-primary font-bold` |
| Card stat | `bg rounded padding` | `bg: hsl(226 40% 13%) · rounded-xl · p-2.5` |
| Stat label | `font color` | `text-[8px] text-muted-foreground` |
| Stat value | `font color` | `text-xs font-bold text-primary` |

---

## 🧭 Bottom Navigation (Compartilhada)

| Elemento | Propriedade | Valor |
|---|---|---|
| Container | `bg border-top padding` | `bg: hsl(226 44% 9%) · border-top: hsl(226 35% 20%) · py-2 px-2` |
| Ícone inativo | `color` | `text-muted-foreground` |
| Label inativo | `font color` | `text-[7px] text-muted-foreground` |
| Ícone ativo | `color` | `text-primary` |
| Label ativo | `font color` | `text-[7px] text-primary font-semibold` |
| FAB mapa (centro) | `w h bg rounded shadow` | `36×36px · rounded-full · gradiente teal · -mt-4 · btn-teal-glow` |

---

## 🪟 Phone Frame (Wrapper)

| Propriedade | Valor |
|---|---|
| `border-radius` | `2.5rem (40px)` |
| `border` | `2px solid hsl(226 35% 22%)` |
| `inner-border` | `1px solid hsl(226 35% 30% / 0.3)` |
| `box-shadow` | `0 32px 80px -16px hsl(226 44% 4% / 0.8)` |
| `aspect-ratio` | `9 / 19` |
| `max-width` | `220px` |
| `background` | `hsl(226 44% 9%)` |

---

## 💡 Efeitos Especiais

| Classe | Efeito |
|---|---|
| `.btn-teal-glow` | `box-shadow: 0 8px 32px -8px hsl(180 75% 52% / 0.4)` |
| `.chart-bar` | `linear-gradient(180deg, teal 0%, teal/30% 100%) · radius: 4px 4px 0 0` |
| Logo glow | `box-shadow: 0 0 32px hsl(180 75% 52% / 0.4)` |

---

> **Dica para Figma:** Use o plugin **`html.to.design`** com a URL publicada do projeto para importar as telas automaticamente com estilos e componentes.
