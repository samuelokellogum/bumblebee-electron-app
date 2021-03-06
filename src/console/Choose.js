import React from "react";

function Chooices(props) {
	const choices = props.choose.choices;
	return (<ul className="choices nobullet">{
		choices.map((choice, index) => (<li>
			<a className="number" href="#" onClick={e => props.bumblebee.simulateSTT(choice.text)}>{choice.text}</a>
		</li>))
	}</ul>);
}
function NumberizedChooices(props) {
	const choices = props.choose.choices;
	return (<ul className="choices nobullet">{
		choices.map((choice, index) => (<li key={index}>
			<a className="number" href="#" onClick={e => props.bumblebee.simulateSTT(choice.number)}>{choice.number}</a>:&nbsp;
			<a className="text" href="#" onClick={e => props.bumblebee.simulateSTT(choice.text)}>{choice.text}</a>
		</li>))
	}</ul>);
}
function YesOrNo(props) {
	const choices = props.choose.choices;
	return (<span>
		<a className="yes" href="#" onClick={e => {
			props.bumblebee.simulateSTT(choices[0].text)
		}}>{choices[0].text}</a> or <a className="no" href="#" onClick={e => {
			props.bumblebee.simulateSTT(choices[1].text)
		}}>{choices[1].text}</a>
	</span>);
}

export default function Choose(props) {
	if (props.choose.style === "yes_or_no") {
		return (<YesOrNo {...props}/>);
	}
	else if (props.choose.numberize) {
		return (<NumberizedChooices {...props}/>);
	}
	else {
		return (<Chooices {...props}/>);
	}
}
