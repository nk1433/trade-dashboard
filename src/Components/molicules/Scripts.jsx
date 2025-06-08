import { Box, Button, Input } from "@mui/material";
import { useEffect, useState } from "react";
import scripts from "../../assets/output.json";

const DisplayScript = () => {
    const [script, setScript] = useState("");
    const [matchedScripts, setMatchedScripts] = useState([]);
    const [trackingScripts, setTrackingScripts] = useState([]);

    useEffect(() => {
        setTrackingScripts(localStorage.getItem("scripts")
            ? JSON.parse(localStorage.getItem("scripts"))
            : []
        );
    }, []);

    const performSearch = (searchTerm) => {
        if (searchTerm.trim().length > 3) {

            for (let i = 0; i < scripts.length; i++) {
                const scriptName = scripts[i].name.toLowerCase();

                if (scriptName.includes(searchTerm.toLowerCase())) {
                    setMatchedScripts(prev => [...prev, scripts[i]]);
                }
            }
        }
        else {
            setMatchedScripts([]);
        }
    };

    const storeScript = (matchedScript) => {
        const items = localStorage.getItem("scripts");

        if (!items) {
            localStorage.setItem("scripts", JSON.stringify(matchedScripts));
        }
        else {
            const existingScripts = JSON.parse(items);
            const hasScriptExist = existingScripts.find(script => script.instrument_key === matchedScript.instrument_key);
            const newScripts = hasScriptExist ? existingScripts : [...existingScripts, matchedScript];

            localStorage.setItem("scripts", JSON.stringify(newScripts));
            setTrackingScripts(newScripts);
            setMatchedScripts([]);
        }
    };

    const removeScript = (instrument_key) => {
        const items = localStorage.getItem("scripts");

        if (items) {
            const existingScripts = JSON.parse(items);
            const updatedScripts = existingScripts.filter(s => s.instrument_key !== instrument_key);

            localStorage.setItem("scripts", JSON.stringify(updatedScripts));
            setTrackingScripts(updatedScripts);
        }
    };

    return (
        <Box display="flex" gap={2} padding={2}>
            <Box>
                <Input type="text" placeholder="Script name" value={script} onChange={(e) => setScript(e.target.value)} onKeyDown={(e) => {
                    console.log(e.key)
                    if (e.key === 'Enter') {
                        performSearch(script);
                        setScript("");
                    }
                }} />
                <Button onClick={() => {
                    performSearch(script);
                    setScript("");
                }}>
                    Search
                </Button>
                {
                    matchedScripts.map((script) => {
                        const { name, instrument_key } = script;

                        return name
                            ? (
                                <li key={instrument_key}>
                                    <span>{name}</span>
                                    <span> - </span>
                                    <span>{instrument_key}</span>
                                    <Button onClick={() => {
                                        storeScript(script);
                                    }}>
                                        Track
                                    </Button>
                                </li>
                            )
                            : <></>
                    })
                }
            </Box>
            <Box>
                {
                    trackingScripts.length
                        ? trackingScripts.map(({ name, instrument_key }) => {

                            return name
                                ? (
                                    <li key={instrument_key}>
                                        <span>{name}</span>
                                        <span> - </span>
                                        <span>{instrument_key}</span>
                                        <Button onClick={() => removeScript(instrument_key)}>
                                            Untrack
                                        </Button>
                                    </li>
                                )
                                : <></>
                        })
                        : <p>No scripts tracked yet.</p>
                }
            </Box>
        </Box>
    );
}

export default DisplayScript;