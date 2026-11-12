type Props = {
  title: string
  description: string
  // 이 화면에 들어갈 기능 목록 (기능명세서 기준)
  todos: string[]
}

// 아직 구현하지 않은 화면에 임시로 보여주는 안내 카드. 화면을 구현하면 이 컴포넌트는 지운다.
// (화면 이름 h1 은 AppLayout 의 상단 바가 이미 보여주므로 여기서는 h2 를 쓴다)
export default function PagePlaceholder({ title, description, todos }: Props) {
  return (
    <section className="p-2xl">
      <h2 className="text-h2 font-semibold">{title}</h2>
      <p className="mt-2xs text-body3 text-black-300">{description}</p>

      <div className="mt-l rounded-m border border-gray-300 bg-white p-l">
        <h3 className="text-body3 font-semibold text-primary-600">구현 예정 기능</h3>
        <ul className="mt-s list-disc space-y-xs pl-l text-body3">
          {todos.map((todo) => (
            <li key={todo}>{todo}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
