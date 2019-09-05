port module Main exposing (Model)

import Browser
import Browser.Events
import Html exposing (..)
import Html.Attributes exposing (class, href, id, src)
import Html.Events exposing (..)
import Json.Decode as Decode
import Os
import Task
import Time
import Types exposing (KeyValue)
import Util


main : Program () Model Msg
main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }



-- MODEL


type alias Hist =
    ( LineInput, Os.CmdResult )


type alias Model =
    { current : String
    , hists : List Hist
    , posix : Time.Posix
    , zone : Time.Zone
    , system : Os.System
    , candidates : List String
    }


type Msg
    = Type KeyValue
    | ScrollBottom
    | SetSystemTime ( Time.Zone, Time.Posix )
    | SetCurrentTime Time.Posix


setSystemTime : Cmd Msg
setSystemTime =
    Task.perform SetSystemTime <| Task.map2 Tuple.pair Time.here Time.now


init : () -> ( Model, Cmd Msg )
init _ =
    ( { current = "help"
      , hists = []
      , posix = Time.millisToPosix 0
      , zone = Time.utc
      , system = Os.initialSystem
      , candidates = Os.enumerateCmds Os.initialSystem
      }
    , setSystemTime
    )



-- UTIL
-- UPDATE


port scrollBottom : () -> Cmd msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Type (Types.Character c) ->
            ( { model | current = model.current ++ String.fromChar c }, Cmd.none )

        Type (Types.Control "Enter") ->
            let
                ( execResult, newSystem ) =
                    case String.split " " model.current of
                        cmd :: args ->
                            Os.exec model.system cmd (args |> List.filterMap (\s -> if s == "" then Nothing else Just s))

                        _ ->
                            ( Os.NoCmd, model.system )
            in
            case execResult of
                Os.Clear ->
                    ( { model
                        | current = ""
                        , hists = [ ( modelToLineInput model, Os.Clear ) ]
                        , candidates = Os.enumerateCmds newSystem
                        , system = newSystem
                      }
                    , scrollBottom ()
                    )

                other ->
                    ( { model
                        | current = ""
                        , hists = ( modelToLineInput model, other ) :: model.hists
                        , candidates = Os.enumerateCmds newSystem
                        , system = newSystem
                      }
                    , scrollBottom ()
                    )

        Type (Types.Control "Backspace") ->
            ( { model | current = String.left (String.length model.current - 1) model.current }, Cmd.none )

        Type (Types.Control "Space") ->
            case model.current of
                "" ->
                    ( model, Cmd.none )

                other ->
                    ( { model | current = model.current ++ " " }, Cmd.none )

        Type (Types.Control _) ->
            ( model, Cmd.none )

        ScrollBottom ->
            ( model, scrollBottom () )

        SetSystemTime ( zone, time ) ->
            ( { model | posix = time, zone = zone }, Cmd.none )

        SetCurrentTime time ->
            ( { model | posix = time }, Cmd.none )



-- VIEW


renderPrompt =
    span [] [ span [ class "arrow" ] [ text "×> " ], span [ class "dir" ] [ text "~/ " ] ]


type LineInput
    = Invalid ( String, String )
    | Valid ( String, String )


modelToLineInput : Model -> LineInput
modelToLineInput model =
    let
        splited =
            model.current |> String.split " "

        cmd =
            splited |> List.head |> Maybe.withDefault ""

        args =
            splited |> List.tail |> Maybe.withDefault [] |> String.join " "
    in
    if List.member cmd model.candidates then
        Valid ( cmd, args )

    else
        Invalid ( cmd, args )


renderLine : LineInput -> Html Msg
renderLine input =
    case input of
        Valid ( cmd, args ) ->
            span [] [ span [ class "complete" ] [ text cmd ], text " ", span [ class "args" ] [ text args ] ]

        Invalid ( cmd, args ) ->
            span [] [ span [ class "error" ] [ text cmd ], text " ", span [ class "args" ] [ text args ] ]


toEnMonth : Time.Month -> String
toEnMonth month =
    case month of
        Time.Jan ->
            "Jan"

        Time.Feb ->
            "Feb"

        Time.Mar ->
            "Mar"

        Time.Apr ->
            "Apr"

        Time.May ->
            "May"

        Time.Jun ->
            "Jun"

        Time.Jul ->
            "Jul"

        Time.Aug ->
            "Aug"

        Time.Sep ->
            "Sep"

        Time.Oct ->
            "Oct"

        Time.Nov ->
            "Nov"

        Time.Dec ->
            "Dec"


renderPowerline : Model -> Html Msg
renderPowerline model =
    let
        year =
            Time.toYear model.zone model.posix |> String.fromInt

        month =
            Time.toMonth model.zone model.posix |> toEnMonth

        day =
            Time.toDay model.zone model.posix |> String.fromInt

        hour =
            Time.toHour model.zone model.posix |> String.fromInt

        minute =
            Time.toMinute model.zone model.posix |> String.fromInt

        second =
            Time.toSecond model.zone model.posix |> String.fromInt
    in
    footer []
        [ span [ class "terminal-info" ] [ text "fish- 1:namachan10777*" ]
        , span [ class "time" ] [ text (month ++ " " ++ day ++ " " ++ year ++ " " ++ hour ++ ":" ++ minute ++ ":" ++ second) ]
        ]


renderHists : List Hist -> List (Html Msg)
renderHists hists =
    hists
        |> List.map
            (\hist ->
                case hist of
                    ( cmd, Os.Stdout s ) ->
                        div []
                            [ div [] [ renderPrompt, renderLine cmd ]
                            , pre [ class "stdout" ] [ text s ]
                            ]

                    ( cmd, Os.Icon ) ->
                        div []
                            [ div [] [ renderPrompt, renderLine cmd ]
                            , img [ src "./res/icon.jpg" ] [ renderPrompt ]
                            , div []
                                [ span [] [ text "by " ]
                                , a [ href "https://twitter.com/hsm_hx" ] [ text "@hsm_hx" ]
                                ]
                            ]

                    ( cmd, _ ) ->
                        div [] [ renderPrompt, renderLine cmd ]
            )


view : Model -> Html Msg
view model =
    let
        lists =
            div [] [ renderPrompt, renderLine (modelToLineInput model) ] :: renderHists model.hists
    in
    div [ id "root" ]
        [ div [ id "scroll-area" ] (List.reverse lists)
        , renderPowerline model
        ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Browser.Events.onKeyDown (Decode.map Type Util.keyDecoder)
        , Time.every 1000 SetCurrentTime
        ]
