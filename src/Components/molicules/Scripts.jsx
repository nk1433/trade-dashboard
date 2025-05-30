import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import scripts from "../../assets/output.json";

const DisplayScript = () => {
    const [script, setScript] = useState("");
    const [matchedScripts, setMatchedScripts] = useState([]);
    const [trackingScripts, setTrackingScripts] = useState([]);

    useEffect(() => {
        const initialScripts = localStorage.getItem("script") ? JSON.parse(localStorage.getItem("script")) : [];
        setTrackingScripts(initialScripts);
    }, [])

    const performSearch = (searchTerm) => {
        if (searchTerm.trim().length > 3) {
            for (let i = 0; i < scripts.length; i++) {
                const scriptName = scripts[i].name.toLowerCase();;
                if (scriptName.includes(searchTerm.toLowerCase())) {
                    setMatchedScripts(prev => [...prev, scripts[i]]);
                }
            }
        }
        else{
            setMatchedScripts([]);
        }
    };

    const storeScript = (matchedScript) => {
        const items = localStorage.getItem("script");
        console.log("items", items);

        if (!items) {
            localStorage.setItem("script", JSON.stringify(matchedScripts));
        }
        else {
            const existingScripts = JSON.parse(items);
            const hasScriptExist = existingScripts.find(script => script.instrument_key === matchedScript.instrument_key);
            const newScripts = hasScriptExist ? existingScripts : [...existingScripts, matchedScript];
            localStorage.setItem("script", JSON.stringify(newScripts));
            setTrackingScripts(newScripts);
        }



        // localStorage.setItem("script", JSON.stringify(matchedScripts));
    };

    const removeScript = (script) => {
        const items = localStorage.getItem("script");
        if (items) {
            const existingScripts = JSON.parse(items);
            const updatedScripts = existingScripts.filter(s => s.instrument_key !== script.instrument_key);
            localStorage.setItem("script", JSON.stringify(updatedScripts));
            setTrackingScripts(updatedScripts);
        }
    }

    return (
        <Box display={"flex"} gap={2} padding={2}>
            <Box>
                {console.log("search", script)}
                <input type="text" placeholder="Script name" value={script} onChange={(e) => setScript(e.target.value)} />
                <button onClick={() => {
                    performSearch(script);
                    setScript("");
                }}>Search</button>
                {
                    matchedScripts.map((script) => {
                        const { name, instrument_key } = script;

                        return name ? <li>
                            <span>{name}</span>
                            <span> - </span>
                            <span>{instrument_key}</span>
                            <button onClick={() => storeScript(script)}>Track</button>
                        </li> : <></>
                    })
                }
            </Box>
            <Box>
                {
                    trackingScripts.length > 0 ? trackingScripts.map((script) => {
                        const { name, instrument_key } = script;

                        return name ? <li key={instrument_key}>
                            <span>{name}</span>
                            <span> - </span>
                            <span>{instrument_key}</span>
                            <button onClick={() => removeScript(script)}>Untrack</button>
                        </li> : <></>
                    }) : <p>No scripts tracked yet.</p>
                }
            </Box>
        </Box>
    );
}

export default DisplayScript;