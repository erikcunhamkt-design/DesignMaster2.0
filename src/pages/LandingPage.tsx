import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Easing } from "framer-motion";
import {
  Wand2, Zap, Shield, Sparkles, ChevronDown, ChevronUp,
  Star, ArrowRight, Check, MessageSquare, Palette, Image,
  Layout, PenTool, Calendar, FileText, Users
} from "lucide-react";
import logo3d from "@/assets/logo-3d.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as Easing },
  }),
};

const features = [
  { icon: "🎨", name: "Design Master", desc: "Gerador principal com controles avançados de composição, iluminação e estilo." },
  { icon: "🧠", name: "Creator Master", desc: "Chat especialista em design, viralização e ideias magnéticas para Instagram." },
  { icon: "🎠", name: "Carrossel Master", desc: "Carrosséis de alto impacto com headlines magnéticas e estrutura AIDA." },
  { icon: "📰", name: "Estrategista Editorial", desc: "Linhas editoriais estratégicas com pilares de conteúdo e posicionamento." },
  { icon: "📅", name: "Calendário Master", desc: "Calendários de conteúdo quinzenais com organização e ideias de posts." },
  { icon: "🖥️", name: "Liga dos Heróis", desc: "Hero sections premium para landing pages comparáveis às melhores marcas." },
  { icon: "📦", name: "Laboratório de Mockups", desc: "Mockups realistas de produtos, embalagens e dispositivos." },
  { icon: "🏟️", name: "Clube das Lendas", desc: "Artes de futebol profissionais — matchday, jogador destaque e flyers." },
  { icon: "🏎️", name: "Velozes & Imortais", desc: "Artes automotivas de alta performance com IA." },
  { icon: "🦁", name: "Animais Fantásticos", desc: "Imagens com animais em alta resolução e acabamento premium." },
  { icon: "🖼️", name: "Restaurador de Fotos", desc: "Restaure fotos antigas com IA — riscos, manchas e colorização." },
  { icon: "🔍", name: "Ultra Upscale", desc: "Ampliação inteligente com preservação total da qualidade." },
];

const testimonials = [
  { name: "Lucas M.", role: "Designer Freelancer", text: "Reduziu meu tempo de criação em 80%. Consigo entregar 3x mais projetos por semana.", stars: 5 },
  { name: "Amanda R.", role: "Social Media Manager", text: "Os carrosséis ficam incríveis. Meus clientes adoram e os resultados de engajamento dobraram.", stars: 5 },
  { name: "Rafael S.", role: "Dono de Agência", text: "A qualidade das imagens é impressionante. Parece que contratamos um fotógrafo profissional.", stars: 5 },
  { name: "Juliana P.", role: "Criadora de Conteúdo", text: "Bio Master e Calendário Master me economizam horas de planejamento toda semana.", stars: 5 },
];

const plans = [
  {
    name: "Plano Mensal",
    price: "R$ 69,99",
    originalPrice: "R$ 149,90",
    period: "/mês",
    features: ["Gerações ilimitadas", "Todas as 16+ ferramentas", "Qualidade máxima (4K)", "Suporte prioritário", "Acesso à comunidade", "Novos recursos primeiro", "Cancele quando quiser"],
    cta: "Assinar Agora",
    popular: true,
    url: "https://pay.kiwify.com.br/7b1lH1a",
  },
];

const faqs = [
  { q: "Preciso saber design para usar?", a: "Não! O Design Master foi feito para qualquer pessoa. Os agentes de IA guiam você passo a passo — basta descrever o que quer e a IA cria para você." },
  { q: "Quais modelos de IA são usados?", a: "Utilizamos os modelos mais avançados do mercado, incluindo Gemini e GPT, para garantir a máxima qualidade em todas as gerações." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem compromisso. Cancele quando quiser diretamente nas configurações da sua conta, sem burocracia." },
  { q: "As imagens geradas têm direitos autorais?", a: "Sim, todas as imagens geradas são suas. Você pode usar comercialmente sem restrições em qualquer plataforma." },
  { q: "Funciona no celular?", a: "Sim! O Design Master é totalmente responsivo e funciona como PWA — instale no seu celular como um app nativo." },
  { q: "Quantas ferramentas estão disponíveis?", a: "Atualmente temos 16+ ferramentas especializadas: geradores de imagem, agentes de conteúdo, restauração, upscale, mockups e muito mais." },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <img src={logo3d} alt="Design Master" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight">Design Master</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Ferramentas</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm font-medium text-foreground rounded-lg border border-border/30 hover:bg-secondary/40 transition-colors"
            >
              Login
            </button>
            <a
              href="https://pay.kiwify.com.br/7b1lH1a"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
            >
              Assinar Agora
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/6 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by AI
            </span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Crie Designs{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Profissionais
            </span>{" "}
            em Segundos
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Studio completo com 16+ ferramentas de IA para gerar imagens, mockups, carrosséis, 
            capas e conteúdo estratégico — sem precisar saber design.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="https://pay.kiwify.com.br/7b1lH1a"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-all shadow-lg shadow-primary/25"
            >
              Assinar Agora
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-border/30 text-foreground font-medium hover:bg-secondary/30 transition-colors"
            >
              Ver Ferramentas
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="mt-12 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
              <span className="ml-2 font-medium">4.9/5</span>
            </div>
            <div className="h-4 w-px bg-border/30" />
            <span>+2.500 usuários ativos</span>
            <div className="h-4 w-px bg-border/30 hidden sm:block" />
            <span className="hidden sm:block">+50.000 imagens criadas</span>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              16+ Ferramentas em{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Um Só Lugar
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo que você precisa para criar conteúdo visual profissional, organizado em categorias intuitivas.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.name}
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} custom={i * 0.5}
                className="group relative p-5 rounded-2xl border border-border/20 bg-card/50 hover:bg-card/80 hover:border-primary/20 transition-all duration-300"
              >
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-sm mb-1">{f.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 md:py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground text-lg">Três passos para resultados profissionais.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <PenTool className="h-6 w-6" />, title: "Descreva", desc: "Escreva o que quer ou escolha um preset. A IA entende linguagem natural." },
              { step: "02", icon: <Wand2 className="h-6 w-6" />, title: "Gere", desc: "A IA cria sua imagem em segundos com qualidade profissional." },
              { step: "03", icon: <Zap className="h-6 w-6" />, title: "Refine", desc: "Ajuste cores, estilo e composição até ficar perfeito. Baixe em alta resolução." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="relative text-center p-8 rounded-2xl border border-border/15 bg-card/30"
              >
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  Passo {s.step}
                </span>
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {s.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 md:py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O Que Nossos Usuários{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dizem</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="p-6 rounded-2xl border border-border/15 bg-card/40"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 md:py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Invista no Seu Conteúdo</h2>
            <p className="text-muted-foreground text-lg">Acesso completo a todas as ferramentas por um preço único.</p>
          </motion.div>

          <div className="max-w-md mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`relative p-8 rounded-2xl border transition-all ${
                  plan.popular
                    ? "border-primary/40 bg-card/60 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border/15 bg-card/30"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                    Mais Popular
                  </span>
                )}
                <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                <div className="mb-6">
                  {plan.originalPrice && (
                    <span className="text-muted-foreground text-lg line-through mr-2">{plan.originalPrice}</span>
                  )}
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl font-semibold text-sm transition-all text-center bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20"
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEAD CAPTURE ─── */}
      <section className="py-20 px-6 border-t border-border/10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Fique por Dentro das Novidades
          </h2>
          <p className="text-muted-foreground mb-8">
            Receba dicas, tutoriais e novos recursos antes de todo mundo.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) {
                setEmail("");
                alert("Obrigado! Você será notificado sobre novidades.");
              }
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-input border border-border/30 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all shrink-0"
            >
              Inscrever
            </button>
          </form>
        </motion.div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 md:py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Perguntas Frequentes</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i * 0.3}
                className="rounded-xl border border-border/15 bg-card/30 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/10 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo3d} alt="Design Master" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold">Design Master</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Ferramentas</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Design Master. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
