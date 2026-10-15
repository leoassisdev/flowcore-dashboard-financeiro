// DashFinanceiro · Criado por FlowCore Soluções LTDA · flowcoresolucoes.com.br/codigos · licença MIT
// Fluxo de caixa: entradas vs. saídas por mês com linha de saldo acumulado,
// DRE resumida e contas a pagar / a receber dos próximos dias com status.
// Pra usar dados reais, troque o objeto DADOS pela resposta da sua API (ou do seu ERP).
// Props: accent (cor de destaque), dados (meses, DRE e contas), tema ("claro" |
// "escuro", padrão "claro") e onTemaChange (avisa quando o botão sol/lua troca).
// Requisitos: React 18+ e Tailwind CSS 3+. Zero dependências.

import { useState, type CSSProperties } from "react";

type Tema = "claro" | "escuro";
type Mes = { mes: string; entradas: number; saidas: number };
type Status = "pago" | "pendente" | "vencido" | "agendado";
type Conta = { id: string; descricao: string; contraparte: string; vencimento: string; valor: number; status: Status };
type LinhaDre = { conta: string; valor: number; nivel: 0 | 1; destaque?: boolean };

// Paleta de cada tema, aplicada como CSS vars na raiz (não depende do dark: do Tailwind).
const TEMAS: Record<Tema, Record<string, string>> = {
  claro: {
    "--fc-bg": "#F7F8FB", "--fc-surface": "#FFFFFF", "--fc-surface-2": "#F1F4F9",
    "--fc-border": "#E3E8F0", "--fc-border-strong": "#CBD3E1",
    "--fc-text": "#0B1220", "--fc-muted": "#4B5565", "--fc-subtle": "#8A94A6",
    "--fc-pos": "#059669", "--fc-neg": "#E11D48", "--fc-warn": "#D97706",
    "--fc-shadow": "0 1px 2px rgba(16,24,40,.06), 0 12px 32px -16px rgba(16,24,40,.18)",
    "--fc-pop": "#FFFFFF", "--fc-grid": "#EDF0F5",
  },
  escuro: {
    "--fc-bg": "#0B0F17", "--fc-surface": "rgba(255,255,255,0.03)", "--fc-surface-2": "rgba(255,255,255,0.06)",
    "--fc-border": "rgba(255,255,255,0.10)", "--fc-border-strong": "rgba(255,255,255,0.25)",
    "--fc-text": "#FFFFFF", "--fc-muted": "rgba(255,255,255,0.60)", "--fc-subtle": "rgba(255,255,255,0.40)",
    "--fc-pos": "#34D399", "--fc-neg": "#FB7185", "--fc-warn": "#FBBF24",
    "--fc-shadow": "0 24px 48px -24px rgba(0,0,0,.6)",
    "--fc-pop": "#111827", "--fc-grid": "rgba(255,255,255,0.06)",
  },
};
const PALETA = ["var(--accent)", "#7C3AED", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];
const tinta = (cor: string, pct: number) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;

// Tema controlado pela prop, mas o botão sol/lua troca por dentro.
function useTema(inicial: Tema, onTemaChange?: (t: Tema) => void) {
  const [tema, setTema] = useState<Tema>(inicial);
  const [prop, setProp] = useState<Tema>(inicial);
  if (prop !== inicial) {
    setProp(inicial);
    setTema(inicial);
  }
  const alternar = () => {
    const novo: Tema = tema === "claro" ? "escuro" : "claro";
    setTema(novo);
    onTemaChange?.(novo);
  };
  return [tema, alternar] as const;
}

function BotaoTema({ tema, onClick }: { tema: Tema; onClick: () => void }) {
  const escuro = tema === "escuro";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-muted)] transition-colors hover:bg-[var(--fc-surface-2)] hover:text-[var(--fc-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {escuro ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
        )}
      </svg>
    </button>
  );
}

const DADOS = {
  saldoInicial: 412_000,
  meses: [
    { mes: "mai", entradas: 486_000, saidas: 421_000 },
    { mes: "jun", entradas: 512_000, saidas: 468_000 },
    { mes: "jul", entradas: 498_000, saidas: 517_000 },
    { mes: "ago", entradas: 561_000, saidas: 474_000 },
    { mes: "set", entradas: 604_000, saidas: 512_000 },
    { mes: "out", entradas: 637_000, saidas: 529_000 },
  ] as Mes[],
  dre: [
    { conta: "Receita bruta", valor: 637_000, nivel: 0 },
    { conta: "(−) Impostos sobre vendas", valor: -71_300, nivel: 1 },
    { conta: "Receita líquida", valor: 565_700, nivel: 0, destaque: true },
    { conta: "(−) Custo dos serviços", valor: -214_900, nivel: 1 },
    { conta: "Lucro bruto", valor: 350_800, nivel: 0, destaque: true },
    { conta: "(−) Despesas comerciais", valor: -88_400, nivel: 1 },
    { conta: "(−) Despesas administrativas", valor: -121_600, nivel: 1 },
    { conta: "EBITDA", valor: 140_800, nivel: 0, destaque: true },
  ] as LinhaDre[],
  pagar: [
    { id: "p1", descricao: "Folha de pagamento", contraparte: "Colaboradores", vencimento: "2026-10-05", valor: 184_000, status: "pago" },
    { id: "p2", descricao: "Aluguel sede", contraparte: "Imobiliária Paulista", vencimento: "2026-10-10", valor: 28_500, status: "vencido" },
    { id: "p3", descricao: "AWS · infraestrutura", contraparte: "Amazon Web Services", vencimento: "2026-10-18", valor: 14_870, status: "agendado" },
    { id: "p4", descricao: "DAS Simples Nacional", contraparte: "Receita Federal", vencimento: "2026-10-20", valor: 41_200, status: "pendente" },
    { id: "p5", descricao: "Licenças de software", contraparte: "Microsoft Brasil", vencimento: "2026-10-25", valor: 6_340, status: "pendente" },
  ] as Conta[],
  receber: [
    { id: "r1", descricao: "Mensalidade Enterprise", contraparte: "Grupo Sena Logística", vencimento: "2026-10-08", valor: 48_000, status: "pago" },
    { id: "r2", descricao: "Implantação · parcela 2/3", contraparte: "Nortec Engenharia", vencimento: "2026-10-12", valor: 22_600, status: "vencido" },
    { id: "r3", descricao: "Mensalidade Business", contraparte: "Alumi Esquadrias", vencimento: "2026-10-16", valor: 12_900, status: "pendente" },
    { id: "r4", descricao: "Consultoria fiscal", contraparte: "Farmácias Bem Estar", vencimento: "2026-10-22", valor: 35_400, status: "agendado" },
    { id: "r5", descricao: "Mensalidade Enterprise", contraparte: "Arvo Agronegócio", vencimento: "2026-10-28", valor: 51_000, status: "pendente" },
  ] as Conta[],
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const data = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const CHIP: Record<Status, { t: string; cor: string }> = {
  pago: { t: "Pago", cor: "var(--fc-pos)" },
  pendente: { t: "Pendente", cor: "var(--accent)" },
  vencido: { t: "Vencido", cor: "var(--fc-neg)" },
  agendado: { t: "Agendado", cor: "var(--fc-warn)" },
};
const Chip = ({ s }: { s: Status }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: tinta(CHIP[s].cor, 12), color: CHIP[s].cor }}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: CHIP[s].cor }} />
    {CHIP[s].t}
  </span>
);
const SAIDA = PALETA[1];

const ICONES_KPI = [
  "M3 7h18v10H3zM7 12h.01M17 12h.01M12 14a2 2 0 100-4 2 2 0 000 4z",
  "M12 19V5M5 12l7-7 7 7",
  "M12 5v14M19 12l-7 7-7-7",
  "M3 17l6-6 4 4 8-8M15 7h6v6",
];

function Grafico({ meses, saldoInicial }: { meses: Mes[]; saldoInicial: number }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const W = 600;
  const H = 240;
  let acc = saldoInicial;
  const saldos = meses.map((m) => (acc += m.entradas - m.saidas));
  const maxBar = Math.max(...meses.flatMap((m) => [m.entradas, m.saidas])) * 1.1;
  const minS = Math.min(...saldos) * 0.9;
  const maxS = Math.max(...saldos) * 1.05;
  const col = W / meses.length;
  const ys = (v: number) => H - 20 - ((v - minS) / (maxS - minS)) * (H - 60);
  const linha = saldos.map((s, i) => `${i ? "L" : "M"}${col * i + col / 2},${ys(s)}`).join(" ");
  const m = ativo !== null ? meses[ativo] : null;

  return (
    <div className="relative h-60">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label={`Entradas e saídas dos últimos ${meses.length} meses com saldo acumulado terminando em ${brl(saldos[saldos.length - 1])}`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--fc-grid)" }} />
        ))}
        {meses.map((mm, i) => {
          const he = (mm.entradas / maxBar) * H;
          const hs = (mm.saidas / maxBar) * H;
          const x = col * i + col * 0.2;
          return (
            <g key={mm.mes} opacity={ativo === null || ativo === i ? 1 : 0.45}>
              <rect x={x} y={H - he} width={col * 0.28} height={he} rx="3" style={{ fill: "var(--accent)" }} />
              <rect x={x + col * 0.32} y={H - hs} width={col * 0.28} height={hs} rx="3" style={{ fill: SAIDA, fillOpacity: 0.75 }} />
            </g>
          );
        })}
        <path d={linha} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ stroke: "var(--fc-pos)" }} />
      </svg>
      <div className="absolute inset-0 flex">
        {meses.map((mm, i) => (
          <div
            key={mm.mes}
            tabIndex={0}
            aria-label={`${mm.mes}: entradas ${brl(mm.entradas)}, saídas ${brl(mm.saidas)}, saldo ${brl(saldos[i])}`}
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
            onFocus={() => setAtivo(i)}
            onBlur={() => setAtivo(null)}
            className="relative flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--fc-pop)] bg-[var(--fc-pos)]" style={{ left: "50%", top: `${(ys(saldos[i]) / H) * 100}%` }} />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-[var(--fc-subtle)]">{mm.mes}</span>
          </div>
        ))}
      </div>
      {m && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 w-48 rounded-lg border border-[var(--fc-border)] bg-[var(--fc-pop)] p-3 text-xs shadow-[var(--fc-shadow)]"
          style={{ left: `${((ativo + 0.5) / meses.length) * 100}%`, transform: `translateX(${ativo >= meses.length / 2 ? "calc(-100% - 16px)" : "16px"})` }}
        >
          <p className="font-medium capitalize">{m.mes} de 2026</p>
          <p className="mt-2 flex justify-between gap-3 text-[var(--fc-muted)]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--accent)]" />Entradas</span><span className="tabular-nums text-[var(--fc-text)]">{brl(m.entradas)}</span></p>
          <p className="mt-1 flex justify-between gap-3 text-[var(--fc-muted)]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: SAIDA }} />Saídas</span><span className="tabular-nums text-[var(--fc-text)]">{brl(m.saidas)}</span></p>
          <p className="mt-1 flex justify-between gap-3 text-[var(--fc-muted)]"><span className="flex items-center gap-1.5"><span className="h-0.5 w-2 rounded bg-[var(--fc-pos)]" />Saldo</span><span className="tabular-nums font-medium text-[var(--fc-pos)]">{brl(saldos[ativo])}</span></p>
        </div>
      )}
    </div>
  );
}

export default function DashFinanceiro({
  accent = "#0057FF",
  dados = DADOS,
  tema = "claro",
  onTemaChange,
}: {
  accent?: string;
  dados?: typeof DADOS;
  tema?: Tema;
  onTemaChange?: (t: Tema) => void;
}) {
  const [modo, alternarTema] = useTema(tema, onTemaChange);
  const [aba, setAba] = useState<"pagar" | "receber">("receber");
  const contas = dados[aba];
  const atual = dados.meses[dados.meses.length - 1];
  const resultado = atual.entradas - atual.saidas;
  const saldoFinal = dados.saldoInicial + dados.meses.reduce((s, m) => s + m.entradas - m.saidas, 0);
  const vencido = contas.filter((c) => c.status === "vencido").reduce((s, c) => s + c.valor, 0);

  return (
    <div style={{ ...TEMAS[modo], colorScheme: modo === "claro" ? "light" : "dark", "--accent": accent } as CSSProperties} data-tema={modo} className="min-h-full bg-[var(--fc-bg)] p-4 text-[var(--fc-text)] sm:p-6 lg:p-8">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--fc-subtle)]">Financeiro · Outubro de 2026</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Fluxo de caixa</h1>
        </div>
        <BotaoTema tema={modo} onClick={alternarTema} />
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Saldo em caixa", v: brl(saldoFinal), c: "", cor: PALETA[0] },
          { l: "Entradas no mês", v: brl(atual.entradas), c: "", cor: PALETA[5] },
          { l: "Saídas no mês", v: brl(atual.saidas), c: "", cor: SAIDA },
          { l: "Resultado do mês", v: brl(resultado), c: resultado >= 0 ? "text-[var(--fc-pos)]" : "text-[var(--fc-neg)]", cor: resultado >= 0 ? "var(--fc-pos)" : "var(--fc-neg)" },
        ].map((k, i) => (
          <div key={k.l} className="min-w-0 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4 shadow-[var(--fc-shadow)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-[var(--fc-muted)]">{k.l}</p>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8" style={{ background: tinta(k.cor, 12), color: k.cor }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={ICONES_KPI[i % ICONES_KPI.length]} />
                </svg>
              </span>
            </div>
            <p className={`mt-1.5 text-lg font-semibold tabular-nums tracking-tight sm:text-2xl ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4 pb-10 shadow-[var(--fc-shadow)] sm:p-6 sm:pb-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Entradas vs. saídas</h2>
            <div className="flex items-center gap-4 text-[11px] text-[var(--fc-muted)]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[var(--accent)]" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: SAIDA }} />Saídas</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-[var(--fc-pos)]" />Saldo</span>
            </div>
          </div>
          <Grafico meses={dados.meses} saldoInicial={dados.saldoInicial} />
        </section>

        <section className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] shadow-[var(--fc-shadow)]">
          <h2 className="px-4 pt-4 text-sm font-medium sm:px-6 sm:pt-5">DRE resumida · outubro</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr><th scope="col">Conta</th><th scope="col">Valor</th></tr>
              </thead>
              <tbody>
                {dados.dre.map((l) => (
                  <tr key={l.conta} className={l.destaque ? "border-t border-[var(--fc-border)]" : ""}>
                    <th scope="row" className={`py-2 text-left font-normal ${l.nivel ? "pl-8 text-[var(--fc-muted)] sm:pl-10" : "pl-4 font-medium sm:pl-6"}`}>{l.conta}</th>
                    <td className={`py-2 pr-4 text-right tabular-nums sm:pr-6 ${l.valor < 0 ? "text-[var(--fc-muted)]" : l.destaque ? "font-semibold" : ""}`}>{brl(l.valor)}</td>
                  </tr>
                ))}
                <tr className="border-t border-[var(--fc-border)]">
                  <th scope="row" className="py-2.5 pl-4 text-left text-xs font-normal text-[var(--fc-subtle)] sm:pl-6">Margem EBITDA</th>
                  <td className="py-2.5 pr-4 text-right text-xs tabular-nums sm:pr-6">
                    <span className="rounded-full px-2 py-0.5 font-medium text-[var(--fc-pos)]" style={{ background: tinta("var(--fc-pos)", 12) }}>
                      {((dados.dre[dados.dre.length - 1].valor / dados.dre[2].valor) * 100).toFixed(1).replace(".", ",")}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] shadow-[var(--fc-shadow)]">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-5">
          <div>
            <h2 className="text-sm font-medium">Próximos vencimentos</h2>
            {vencido > 0 && <p className="mt-0.5 text-xs font-medium text-[var(--fc-neg)]">{brl(vencido)} em atraso</p>}
          </div>
          <div role="group" aria-label="Tipo de conta" className="inline-flex self-start rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface-2)] p-1">
            {(["receber", "pagar"] as const).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={aba === a}
                onClick={() => setAba(a)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${aba === a ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--fc-muted)] hover:text-[var(--fc-text)]"}`}
              >
                A {a}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-3 md:hidden">
          {contas.map((c) => (
            <li key={c.id} className="border-t border-[var(--fc-border)] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{c.descricao}</p>
                  <p className="mt-0.5 text-xs text-[var(--fc-muted)]">{c.contraparte}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{brl(c.valor)}</p>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="tabular-nums text-[var(--fc-muted)]">Vence {data(c.vencimento)}</span>
                <Chip s={c.status} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs text-[var(--fc-subtle)]">
              <tr className="border-b border-[var(--fc-border)]">
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-6">Descrição</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{aba === "pagar" ? "Fornecedor" : "Cliente"}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Vencimento</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th scope="col" className="px-4 py-2.5 font-medium sm:pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className="border-b border-[var(--fc-border)] last:border-0 hover:bg-[var(--fc-surface-2)]">
                  <th scope="row" className="px-4 py-3 font-medium sm:px-6">{c.descricao}</th>
                  <td className="px-4 py-3 text-[var(--fc-muted)]">{c.contraparte}</td>
                  <td className="px-4 py-3 tabular-nums text-[var(--fc-muted)]">{data(c.vencimento)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(c.valor)}</td>
                  <td className="px-4 py-3 sm:pr-6">
                    <Chip s={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-6 flex justify-end">
        <a href="https://flowcoresolucoes.com.br/codigos" target="_blank" rel="noopener" className="text-[11px] text-[var(--fc-subtle)] transition-colors hover:text-[var(--fc-text)]">
          Criado por FlowCore Soluções LTDA
        </a>
      </footer>
    </div>
  );
}
