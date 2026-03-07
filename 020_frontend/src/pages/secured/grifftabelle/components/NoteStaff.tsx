import { useEffect, useRef } from 'react';
import { Factory } from 'vexflow';
import { useId } from 'react';

interface NoteStaffProps {
  note: string | null;
  clef?: 'treble' | 'bass';
}

export function NoteStaff({ note, clef = 'treble' }: NoteStaffProps) {
  const uid = useId().replace(/:/g, '_');
  const containerId = `vexflow_${uid}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !note) return;

    container.innerHTML = '';

    try {
      const vf = new Factory({
        renderer: { elementId: containerId, width: 200, height: 130 },
      });

      const score = vf.EasyScore();
      const system = vf.System({ width: 170, x: 10, y: 10 });

      system
        .addStave({
          voices: [score.voice(score.notes(`${note}/w`))],
        })
        .addClef(clef);

      vf.draw();
    } catch {
      // Note might not be renderable — ignore
    }
  }, [note, clef, containerId]);

  if (!note) {
    return (
      <div className="flex items-center justify-center h-[130px] text-gray-400 text-sm">
        Ton auswählen
      </div>
    );
  }

  return <div id={containerId} ref={containerRef} className="overflow-hidden" />;
}
