
import { Viewer, Worker, type RenderPageProps } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useAuth } from '@/context/AuthContext';

interface PDFViewerProps {
    fileUrl: string;
}

export const PDFViewer = ({ fileUrl }: PDFViewerProps) => {
    const { user } = useAuth();
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const renderPage = (props: RenderPageProps) => {
        return (
            <>
                {props.canvasLayer.children}
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        height: '100%',
                        justifyContent: 'center',
                        left: 0,
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        zIndex: 1,
                        pointerEvents: 'none',
                        transform: 'rotate(-45deg)',
                        opacity: 0.1,
                        fontSize: '3rem',
                        color: '#000',
                        fontWeight: 'bold',
                        userSelect: 'none',
                    }}
                >
                    Eigentum von Musig Elgg - {user?.firstName} {user?.lastName}
                </div>
                {props.annotationLayer.children}
                {props.textLayer.children}
            </>
        );
    };

    return (
        <div style={{ height: '750px', width: '100%', overflow: 'hidden' }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[defaultLayoutPluginInstance]}
                    renderPage={renderPage}
                />
            </Worker>
        </div>
    );
};
