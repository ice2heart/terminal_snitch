package main


import (
	"bufio"
	"bytes"
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"text/template"
)

// https://golang.org/pkg/net/http/#Response

type ExecResult struct {
	Name string
	Code int
}

func main() {
	userMessage := flag.String("m", "Program {{.Name}} has finished with code {{.Code}}", "User defined message")
	tmpl, err := template.New("userMessage").Parse(*userMessage)
	if err != nil {
		panic(err)
	}

	Url := os.Getenv("SNITCH_SERVER_URL")
	if len(Url) == 0 {
		Url = "https://ice2heart.com/api/notify"
	}
	userUuid := os.Getenv("SNITCH_USER_ID")
	flag.Parse()
	tailArgs := flag.Args()
	var message strings.Builder
	if userUuid == "" {
		log.Fatalln("User id isn't setup")
		return
	}
	execResult := ExecResult{"", 0}
	if len(tailArgs) > 0 {
		execResult.Name = tailArgs[0]
		var subArgs []string
		subArgs = append(subArgs, tailArgs[1:]...)
		cmd := exec.Command(tailArgs[0], subArgs...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Env = os.Environ()
		err := cmd.Run()
		message.WriteString(*userMessage)
		if err != nil {
			if msg, ok := err.(*exec.ExitError); ok { // there is error code
				execResult.Code = msg.Sys().(syscall.WaitStatus).ExitStatus()
			}
		} else {
			execResult.Code = 0
		}

	} else {
		reader := bufio.NewReader(os.Stdin)
		for {
			line, _, err := reader.ReadLine()
			if err != nil {
				break
			}
			log.Println(string(line))
		}
	}
	var tpl bytes.Buffer
	tmpl.Execute(&tpl, execResult)
	result := tpl.String()
	resp, err := http.PostForm(Url, url.Values{"userUuid": {userUuid}, "message": {result}})
	if err != nil {
		log.Fatalln(err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	log.Printf("Done = %s", body)
	os.Exit(execResult.Code)
}
