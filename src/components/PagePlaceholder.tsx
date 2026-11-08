type Props = {
  title: string
  description: string
  // 이 화면에 들어갈 기능 목록 (기능명세서 기준)
  todos: string[]
}

// 아직 구현하지 않은 화면에 임시로 보여주는 안내 카드. 화면을 구현하면 이 컴포넌트는 지운다.
export default function PagePlaceholder({ title, description, todos }: Props) {
  return (
    <section>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-brand-700">구현 예정 기능</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
          {todos.map((todo) => (
            <li key={todo}>{todo}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
